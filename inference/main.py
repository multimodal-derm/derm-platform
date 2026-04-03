"""
Inference microservice for multimodal skin cancer detection.

Accepts dermoscopic images + clinical metadata from the Go gateway
and returns predictions with XAI output.
"""

import logging
import os

from contextlib import asynccontextmanager
from io import BytesIO

from fastapi import FastAPI, File, Form, UploadFile, HTTPException
from PIL import Image

from engine import InferenceEngine
from schemas import (
    PredictionResponse,
    ModelInfoResponse,
    HealthResponse,
    ErrorResponse,
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)

# ── Global engine instance ──
engine: InferenceEngine | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load model on startup, cleanup on shutdown."""
    global engine
    checkpoint = os.getenv("CHECKPOINT_PATH", "best.pt")
    device = os.getenv("DEVICE", None)
    engine = InferenceEngine(checkpoint_path=checkpoint, device=device)
    logger.info(
        "Engine ready (mock_mode=%s, device=%s)", engine.mock_mode, engine.device
    )
    yield
    logger.info("Shutting down inference service")


app = FastAPI(
    title="Derm Platform Inference Service",
    version="1.0.0",
    lifespan=lifespan,
)


@app.get("/health", response_model=HealthResponse)
async def health():
    """Health check endpoint."""
    return HealthResponse(
        status="healthy",
        model_loaded=engine is not None and not engine.mock_mode,
        device=engine.device if engine else "unknown",
    )


@app.get("/model/info", response_model=ModelInfoResponse)
async def model_info():
    """Return model architecture metadata."""
    return ModelInfoResponse()


@app.post(
    "/predict",
    response_model=PredictionResponse,
    responses={400: {"model": ErrorResponse}, 500: {"model": ErrorResponse}},
)
async def predict(
    image: UploadFile = File(..., description="Dermoscopic image (JPEG/PNG)"),
    age: int = Form(...),
    sex: str = Form(...),
    fitzpatrick: str = Form(...),
    location: str = Form(...),
    diameter: float = Form(...),
    itch: bool = Form(default=False),
    grew: bool = Form(default=False),
    hurt: bool = Form(default=False),
    changed: bool = Form(default=False),
    bleed: bool = Form(default=False),
    elevation: bool = Form(default=False),
):
    """Run multimodal prediction on a dermoscopic image with clinical metadata."""
    if engine is None:
        raise HTTPException(status_code=500, detail="Engine not initialized")

    # Read and validate image
    try:
        contents = await image.read()
        pil_image = Image.open(BytesIO(contents)).convert("RGB")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid image: {e}")

    # Build metadata dict
    metadata = {
        "age": age,
        "sex": sex,
        "fitzpatrick": fitzpatrick,
        "location": location,
        "diameter": diameter,
        "itch": itch,
        "grew": grew,
        "hurt": hurt,
        "changed": changed,
        "bleed": bleed,
        "elevation": elevation,
    }

    # Run inference
    try:
        result = engine.predict(pil_image, metadata)
    except Exception as e:
        logger.exception("Prediction failed")
        raise HTTPException(status_code=500, detail=f"Inference error: {e}")

    return PredictionResponse(**result)
