# Architecture

## Three-Stream Pipeline

The system uses a locked three-stream architecture where each stream extracts
a different modality of information, and a cross-attention fusion module
combines them for final classification.
```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│  Stream 1         │     │  Stream 2         │     │  Stream 3         │
│  Vision           │     │  Text             │     │  ABCD Features    │
│                   │     │                   │     │                   │
│  Image (448×448)  │     │  Metadata (26 col)│     │  Lesion mask      │
│  ──► MedSigLIP    │     │  ──► Textification│     │  ──► Asymmetry    │
│  ──► patch tokens │     │  ──► ClinicalBERT │     │  ──► Border       │
│  (B, 1024, 1152)  │     │  (B, 768)         │     │  ──► Color        │
│                   │     │                   │     │  ──► Diameter      │
└────────┬──────────┘     └────────┬──────────┘     └────────┬──────────┘
         │ Key, Value              │ Query                    │
         └────────────┬────────────┘                          │
                      ▼                                       │
         ┌────────────────────────┐                           │
         │  Cross-Attention       │                           │
         │  d_k=256, 8 heads      │                           │
         │  ──► pooled (B, 256)   │                           │
         └────────────┬───────────┘                           │
                      │                    ┌──────────────────┘
                      │                    │ projection (B, 256)
                      ▼                    ▼
         ┌─────────────────────────────────────┐
         │  Late-Fusion Concat (B, 512)        │
         │  ──► MLP 512 → 256 → 6 (logits)    │
         └─────────────────────────────────────┘
```

## Stream 1 — Vision (MedSigLIP)

- **Model:** `google/medsiglip-448`
- **Input:** `(B, 3, 448, 448)` — RGB image, normalized with mean/std=0.5 (not ImageNet stats)
- **Output:** `(B, 1024, 1152)` patch tokens from `last_hidden_state` (not `pooler_output`)
- **Preprocessing:** MedSigLIP processor handles normalization and dynamic resize to 448×448
- **Patch grid:** 32×32 = 1,024 patch tokens, each 1,152-dim
- `IMAGE_FEATURE_DIM = 1152` (not 1024 — this has caused PR issues)

## Stream 2 — Text (ClinicalBERT)

- **Textification:** Template-based pipeline converts 26 PAD-UFES-20 metadata columns into English clinical narratives
- **Model:** `medicalai/ClinicalBERT` (768-dim, MLM-pretrained on clinical notes)
- **Output:** `(B, 768)` sentence embedding
- **Selection:** Winner of 10-model benchmark (#82) — 0.7410 macro F1, 0.9557 ROC-AUC, fastest 768-dim at 44.8s inference

## Stream 3 — ABCD Features (Handcrafted)

- **Input:** Segmented lesion mask
- **Features:** Asymmetry, border irregularity, color variation, diameter
- **Output:** `(B, N_abcd)` raw feature vector
- **Role:** Late-fused after cross-attention pooling (concatenated, not injected into cross-attention)

## Fusion Module (Cross-Attention + Late Fusion)

- **Cross-attention:** Text embedding projected to d_k=256 as Query; image patch tokens projected to d_k=256 as Key and Value
- **Attention heads:** 8
- **Pooling:** Mean-pool cross-attention output → `(B, 256)`
- **ABCD projection:** Raw ABCD features → Linear → `(B, 256)`
- **Late-fusion concat:** `[pooled_attn, abcd_proj]` → `(B, 512)`
- **MLP head:** 512 → 256 → 6 (logits)
- **Dropout:** 0.3 in MLP head

## XAI (Explainability)

- **Method:** Cross-attention weights from the fusion layer
- **Shape:** `(B, 1, 1024)` — attention over the 32×32 image patch grid
- **Access:** `fusion.get_attention_weights()` after forward pass
- **Visualization:** Reshaped to 32×32 heatmap overlaid on the original image
- **Not used:** Grad-CAM, ViT attention rollout

## Key Constants
```python
# src/common/constants.py
MEDSIGLIP_MODEL_NAME = "google/medsiglip-448"
IMAGE_FEATURE_DIM = 1152        # MedSigLIP true hidden size
IMAGE_TOKEN_COUNT = 1024        # 32×32 patch grid
TEXT_EMBED_DIM = 768            # ClinicalBERT output dim
CROSS_ATTN_DK = 256            # Query/Key projection dim
CROSS_ATTN_HEADS = 8           # Attention heads
ABCD_FEATURE_DIM = 128         # Raw ABCD vector size
ABCD_EMBED_DIM = 256           # Projected ABCD dim for late fusion
FUSION_DIM = 512               # d_k + abcd_embed_dim
FUSION_DROPOUT_RATE = 0.3      # Dropout in MLP head
NUM_CLASSES = 6                # ACK, BCC, MEL, NEV, SCC, SEK
```

## Implementation

| Component | File | Owner |
|-----------|------|-------|
| Vision encoder | `src/cv/models/vision_encoder.py` | Sourav |
| DataLoader | `src/cv/data/dataloaders.py` | Skandhan |
| Textification | `scripts/preprocessing/generate_text.py` | Rahul |
| Cross-attention fusion | `src/fusion/models/fusion.py` | Nitesh |
| Metrics | `src/common/metrics.py` | Joe |
| Fairness | `src/common/fairness.py` | Akash |
| Training loop | `src/common/training.py` | Sourav |
| Streamlit demo | `demo/app.py` | Akash |