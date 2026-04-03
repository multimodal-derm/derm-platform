"""Request and response schemas for the inference service."""

from pydantic import BaseModel, Field


class ClinicalMetadata(BaseModel):
    """Clinical metadata submitted alongside the dermoscopic image."""

    age: int = Field(..., ge=0, le=120, description="Patient age")
    sex: str = Field(..., description="Patient sex (male/female)")
    fitzpatrick: str = Field(..., description="Fitzpatrick skin type (I-VI)")
    location: str = Field(..., description="Anatomical location of lesion")
    diameter: float = Field(..., ge=0, description="Lesion diameter in mm")
    itch: bool = Field(default=False)
    grew: bool = Field(default=False)
    hurt: bool = Field(default=False)
    changed: bool = Field(default=False)
    bleed: bool = Field(default=False)
    elevation: bool = Field(default=False)


class ABCDFeatures(BaseModel):
    """Extracted ABCD handcrafted features (14-dim total)."""

    asymmetry: list[float] = Field(..., min_length=2, max_length=2)
    border: list[float] = Field(..., min_length=2, max_length=2)
    color: list[float] = Field(..., min_length=6, max_length=6)
    diameter: list[float] = Field(..., min_length=1, max_length=1)
    texture: list[float] = Field(..., min_length=3, max_length=3)


class XAIOutput(BaseModel):
    """Explainability output from cross-attention weights."""

    attention_weights: list[list[float]] = Field(
        ..., description="Cross-attention weight matrix"
    )


class PredictionResponse(BaseModel):
    """Full prediction response returned to the gateway."""

    prediction: str = Field(..., description="Predicted class label")
    confidence: float = Field(..., ge=0, le=1)
    risk_level: str = Field(..., description="HIGH / MODERATE / LOW")
    probabilities: dict[str, float] = Field(
        ..., description="Per-class softmax probabilities"
    )
    abcd_features: ABCDFeatures
    xai: XAIOutput
    clinical_text: str = Field(
        ..., description="Auto-generated clinical narrative sent to ClinicalBERT"
    )
    model_version: str = "1.0.0"
    inference_time_ms: int = Field(..., ge=0)


class ModelInfoResponse(BaseModel):
    """Model metadata."""

    architecture: str = "Cross-Attention Fusion + Late Fusion MLP"
    classes: list[str] = ["ACK", "BCC", "MEL", "NEV", "SCC", "SEK"]
    vision_model: str = "google/medsiglip-448"
    text_model: str = "medicalai/ClinicalBERT"
    abcd_dim: int = 14
    version: str = "1.0.0"


class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    device: str


class ErrorResponse(BaseModel):
    error: str
    details: str | None = None
