"""
Standalone model definition for multimodal skin cancer detection.

Matches the exact state_dict key structure from best.pt:
  - vision_encoder.backbone.vision_model.*
  - fusion.text_proj / image_proj / cross_attn / attn_norm / abcd_proj / classifier

Text encoder (ClinicalBERT) is NOT part of the model — it runs externally
and feeds [B, 768] features into the fusion module.
"""

import torch
import torch.nn as nn
from transformers import SiglipVisionModel


class VisionEncoder(nn.Module):
    """Wraps MedSigLIP vision model. Frozen except head + post_layernorm."""

    def __init__(self, model_name: str = "google/medsiglip-448"):
        super().__init__()
        self.backbone = SiglipVisionModel.from_pretrained(model_name)

        # Freeze everything, then unfreeze head + post_layernorm
        for param in self.backbone.parameters():
            param.requires_grad = False
        for param in self.backbone.vision_model.post_layernorm.parameters():
            param.requires_grad = True
        for param in self.backbone.vision_model.head.parameters():
            param.requires_grad = True

    def forward(self, pixel_values: torch.Tensor) -> torch.Tensor:
        """
        Args:
            pixel_values: [B, 3, 448, 448]
        Returns:
            Patch-level features: [B, 1024, 1152]
            (1024 patches = (448/14)^2, 1152 = hidden dim)
        """
        outputs = self.backbone(pixel_values=pixel_values)
        return outputs.last_hidden_state  # [B, 1024, 1152]


class FusionModule(nn.Module):
    """
    Cross-attention fusion + ABCD late fusion + MLP classifier.

    Architecture (from checkpoint):
        text_proj:   Linear(768 → 256)
        image_proj:  Linear(1152 → 256)
        cross_attn:  MultiheadAttention(embed_dim=256, num_heads=8)
                     text=Q, image=K/V
        attn_norm:   LayerNorm(256)
        abcd_proj:   Sequential(Linear(14 → 256))
        classifier:  Sequential(Linear(512 → 256), ReLU, Dropout, Linear(256 → 6))
                     Input: concat(cross_attn_out[256], abcd_proj[256]) = 512
    """

    def __init__(
        self,
        text_dim: int = 768,
        image_dim: int = 1152,
        proj_dim: int = 256,
        abcd_dim: int = 14,
        num_heads: int = 8,
        num_classes: int = 6,
        dropout: float = 0.1,
    ):
        super().__init__()

        # Projection layers
        self.text_proj = nn.Linear(text_dim, proj_dim)
        self.image_proj = nn.Linear(image_dim, proj_dim)

        # Cross-attention: text queries attend to image keys/values
        self.cross_attn = nn.MultiheadAttention(
            embed_dim=proj_dim,
            num_heads=num_heads,
            dropout=dropout,
            batch_first=True,
        )
        self.attn_norm = nn.LayerNorm(proj_dim)

        # ABCD features projected to same dim as cross-attn output
        self.abcd_proj = nn.Sequential(nn.Linear(abcd_dim, proj_dim))

        # Classifier: concat(cross_attn[256], abcd[256]) → 512 → 256 → 6
        self.classifier = nn.Sequential(
            nn.Linear(proj_dim * 2, proj_dim),  # 512 → 256
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(proj_dim, num_classes),  # 256 → 6
        )

    def forward(
        self,
        image_features: torch.Tensor,
        text_features: torch.Tensor,
        abcd_features: torch.Tensor,
    ) -> tuple[torch.Tensor, torch.Tensor]:
        """
        Args:
            image_features: [B, seq_len, 1152] from MedSigLIP
            text_features:  [B, 768] CLS pooled from ClinicalBERT
            abcd_features:  [B, 14] handcrafted features
        Returns:
            logits: [B, 6]
            attention_weights: [B, 1, seq_len]
        """
        # Project to shared dimension
        image_proj = self.image_proj(image_features)  # [B, seq, 256]

        text_proj = self.text_proj(text_features)  # [B, 256]
        if text_proj.dim() == 2:
            text_proj = text_proj.unsqueeze(1)  # [B, 1, 256] — single query

        # Cross-attention: text queries, image keys/values
        attn_out, attn_weights = self.cross_attn(
            query=text_proj,
            key=image_proj,
            value=image_proj,
            need_weights=True,
        )
        attn_out = self.attn_norm(attn_out)  # [B, 1, 256]
        attn_out = attn_out.squeeze(1)  # [B, 256]

        # ABCD projection + late fusion
        abcd_proj = self.abcd_proj(abcd_features)  # [B, 256]
        fused = torch.cat([attn_out, abcd_proj], dim=-1)  # [B, 512]

        # Classify
        logits = self.classifier(fused)  # [B, 6]

        return logits, attn_weights


class MultimodalSkinCancerModel(nn.Module):
    """
    Full multimodal model for skin cancer detection.

    State dict structure:
        vision_encoder.backbone.vision_model.*  (MedSigLIP, partially frozen)
        fusion.*                                 (trainable fusion + classifier)

    Note: ClinicalBERT text encoder is NOT part of this model.
    Text features are computed externally and passed as input.
    """

    def __init__(self):
        super().__init__()
        self.vision_encoder = VisionEncoder()
        self.fusion = FusionModule()

    def forward(
        self,
        pixel_values: torch.Tensor,
        text_features: torch.Tensor,
        abcd_features: torch.Tensor,
    ) -> dict:
        """
        Args:
            pixel_values:  [B, 3, 448, 448]
            text_features: [B, 768] — pre-computed ClinicalBERT CLS output
            abcd_features: [B, 14]
        Returns:
            dict with 'logits' [B, 6] and 'attention_weights' [B, 1, seq_len]
        """
        image_features = self.vision_encoder(pixel_values)
        logits, attention_weights = self.fusion(
            image_features, text_features, abcd_features
        )
        return {"logits": logits, "attention_weights": attention_weights}