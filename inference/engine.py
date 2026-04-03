"""
Inference engine for the multimodal skin cancer detection model.

Supports two modes:
  - Real mode: loads best.pt and runs the full pipeline
  - Mock mode: returns realistic dummy predictions for frontend development

The engine auto-selects mock mode if best.pt is not found.
"""

import logging
import time
from pathlib import Path

import numpy as np
import torch
from PIL import Image

logger = logging.getLogger(__name__)

CLASS_NAMES = ["ACK", "BCC", "MEL", "NEV", "SCC", "SEK"]

RISK_MAP = {
    "MEL": "HIGH",
    "BCC": "HIGH",
    "SCC": "HIGH",
    "ACK": "MODERATE",
    "NEV": "LOW",
    "SEK": "LOW",
}


class InferenceEngine:
    """Multimodal inference engine with automatic mock fallback."""

    def __init__(self, checkpoint_path: str = "best.pt", device: str | None = None):
        self.checkpoint_path = Path(checkpoint_path)
        self.device = device or ("cuda" if torch.cuda.is_available() else "cpu")
        self.model = None
        self.vision_processor = None
        self.text_tokenizer = None
        self.mock_mode = False

        self._load()

    def _load(self):
        """Load the model checkpoint and processors."""
        if not self.checkpoint_path.exists():
            logger.warning(
                "Checkpoint not found at %s — running in MOCK mode",
                self.checkpoint_path,
            )
            self.mock_mode = True
            return

        try:
            logger.info("Loading checkpoint from %s", self.checkpoint_path)
            checkpoint = torch.load(
                self.checkpoint_path, map_location=self.device, weights_only=False
            )

            # Import model class from the main repo
            # This assumes the multimodal-skin-cancer-detection package is installed
            # or the relevant modules are on PYTHONPATH
            from src.models.multimodal_model import MultimodalSkinCancerModel

            self.model = MultimodalSkinCancerModel()
            self.model.load_state_dict(checkpoint["model_state_dict"])
            self.model.to(self.device)
            self.model.eval()

            # Load processors
            from transformers import AutoProcessor, AutoTokenizer

            self.vision_processor = AutoProcessor.from_pretrained(
                "google/medsiglip-448"
            )
            self.text_tokenizer = AutoTokenizer.from_pretrained(
                "medicalai/ClinicalBERT"
            )

            logger.info(
                "Model loaded successfully on %s (mock_mode=False)", self.device
            )

        except Exception as e:
            logger.error("Failed to load model: %s — falling back to MOCK mode", e)
            self.mock_mode = True

    def generate_clinical_text(self, metadata: dict) -> str:
        """Auto-generate clinical narrative from structured metadata."""
        parts = [
            f"Patient is a {metadata['age']}-year-old {metadata['sex']}",
            f"with Fitzpatrick skin type {metadata['fitzpatrick']}.",
            f"Lesion located on the {metadata['location']}",
            f"with a diameter of {metadata['diameter']}mm.",
        ]

        symptoms = []
        symptom_map = {
            "itch": "itching",
            "grew": "recent growth",
            "hurt": "pain",
            "changed": "recent changes",
            "bleed": "bleeding",
            "elevation": "elevation",
        }
        for key, desc in symptom_map.items():
            if metadata.get(key):
                symptoms.append(desc)

        if symptoms:
            parts.append(f"Reported symptoms: {', '.join(symptoms)}.")
        else:
            parts.append("No symptoms reported.")

        return " ".join(parts)

    @torch.no_grad()
    def predict(self, image: Image.Image, metadata: dict) -> dict:
        """Run full multimodal prediction pipeline."""
        start = time.time()
        clinical_text = self.generate_clinical_text(metadata)

        if self.mock_mode:
            result = self._mock_predict(metadata, clinical_text)
        else:
            result = self._real_predict(image, metadata, clinical_text)

        result["inference_time_ms"] = int((time.time() - start) * 1000)
        return result

    def _real_predict(
        self, image: Image.Image, metadata: dict, clinical_text: str
    ) -> dict:
        """Run actual model inference."""
        # Process image — MedSigLIP processor handles normalization
        vision_inputs = self.vision_processor(images=image, return_tensors="pt")
        pixel_values = vision_inputs["pixel_values"].to(self.device)

        # Tokenize clinical text
        text_inputs = self.text_tokenizer(
            clinical_text,
            return_tensors="pt",
            padding="max_length",
            truncation=True,
            max_length=128,
        )
        input_ids = text_inputs["input_ids"].to(self.device)
        attention_mask = text_inputs["attention_mask"].to(self.device)

        # Extract ABCD features
        from src.features.abcd_features import extract_abcd_features

        abcd_array = extract_abcd_features(image)
        abcd_tensor = torch.tensor(abcd_array, dtype=torch.float32).unsqueeze(0).to(self.device)

        # Forward pass
        outputs = self.model(
            pixel_values=pixel_values,
            input_ids=input_ids,
            attention_mask=attention_mask,
            abcd_features=abcd_tensor,
        )

        logits = outputs["logits"]
        probs = torch.softmax(logits, dim=-1).squeeze().cpu().numpy()
        attention_weights = outputs.get("attention_weights", torch.zeros(1, 1))
        attention_weights = attention_weights.squeeze().cpu().numpy().tolist()

        pred_idx = int(np.argmax(probs))
        pred_label = CLASS_NAMES[pred_idx]

        return {
            "prediction": pred_label,
            "confidence": float(probs[pred_idx]),
            "risk_level": RISK_MAP[pred_label],
            "probabilities": {
                name: round(float(probs[i]), 4) for i, name in enumerate(CLASS_NAMES)
            },
            "abcd_features": self._format_abcd(abcd_array),
            "xai": {"attention_weights": attention_weights},
            "clinical_text": clinical_text,
            "model_version": "1.0.0",
        }

    def _mock_predict(self, metadata: dict, clinical_text: str) -> dict:
        """Return realistic mock predictions for frontend development."""
        rng = np.random.default_rng(hash(clinical_text) % 2**32)

        # Generate realistic-looking probabilities
        raw = rng.dirichlet(np.ones(6) * 0.5)
        probs = np.sort(raw)[::-1]

        # Shuffle but keep a dominant class
        dominant_idx = rng.integers(0, 6)
        probs_ordered = np.zeros(6)
        probs_ordered[dominant_idx] = probs[0]
        remaining = list(range(6))
        remaining.remove(dominant_idx)
        rng.shuffle(remaining)
        for i, idx in enumerate(remaining):
            probs_ordered[idx] = probs[i + 1]

        pred_idx = dominant_idx
        pred_label = CLASS_NAMES[pred_idx]

        # Generate mock ABCD features
        abcd = np.clip(rng.normal(0.5, 0.2, 14), 0, 1).tolist()
        abcd[10] = float(metadata.get("diameter", 5.0))  # diameter slot

        return {
            "prediction": pred_label,
            "confidence": round(float(probs_ordered[pred_idx]), 4),
            "risk_level": RISK_MAP[pred_label],
            "probabilities": {
                name: round(float(probs_ordered[i]), 4)
                for i, name in enumerate(CLASS_NAMES)
            },
            "abcd_features": self._format_abcd(abcd),
            "xai": {
                "attention_weights": rng.random((8, 8)).tolist(),
            },
            "clinical_text": clinical_text,
            "model_version": "1.0.0-mock",
        }

    @staticmethod
    def _format_abcd(values) -> dict:
        """Format 14-dim ABCD array into structured dict."""
        if isinstance(values, np.ndarray):
            values = values.tolist()
        elif not isinstance(values, list):
            values = list(values)

        # Pad if needed
        while len(values) < 14:
            values.append(0.0)

        return {
            "asymmetry": [round(v, 4) for v in values[0:2]],
            "border": [round(v, 4) for v in values[2:4]],
            "color": [round(v, 4) for v in values[4:10]],
            "diameter": [round(values[10], 4)],
            "texture": [round(v, 4) for v in values[11:14]],
        }
