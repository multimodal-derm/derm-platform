"""
RAG Service — port 8082

Provides grounded clinical summaries for skin lesion predictions
using ChromaDB (ClinicalBERT embeddings) + MedGemma generation.
"""

import logging
import os
import time

from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from engine import RAGEngine

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger("main")

# ── Pydantic models ─────────────────────────────────────────────────────────


class ABCDFeatures(BaseModel):
    asymmetry: list[float] = Field(default_factory=list)
    border: list[float] = Field(default_factory=list)
    color: list[float] = Field(default_factory=list)
    diameter: list[float] = Field(default_factory=list)
    texture: list[float] = Field(default_factory=list)


class SummaryRequest(BaseModel):
    prediction: str
    confidence: float
    risk_level: str = "UNKNOWN"
    probabilities: dict[str, float] = Field(default_factory=dict)
    abcd_features: ABCDFeatures = Field(default_factory=ABCDFeatures)
    clinical_text: str = ""


class SummaryResponse(BaseModel):
    summary: str
    sources_used: int
    generation_time_ms: int


class HealthResponse(BaseModel):
    status: str
    documents_indexed: int
    medgemma_url: str


# ── Engine init ──────────────────────────────────────────────────────────────

engine: RAGEngine | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize RAG engine on startup, cleanup on shutdown."""
    global engine
    medgemma_url = os.getenv("MEDGEMMA_URL", "http://medgemma:8082")
    embed_model = os.getenv("EMBED_MODEL", "medicalai/ClinicalBERT")
    logger.info("Starting RAG engine — MedGemma: %s, Embed: %s", medgemma_url, embed_model)
    engine = RAGEngine(medgemma_url=medgemma_url, embed_model=embed_model)
    logger.info("RAG service ready")
    yield
    logger.info("Shutting down RAG service")


# ── App ──────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="DermPlatform RAG Service",
    description="Retrieval-augmented clinical summary generation",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Routes ───────────────────────────────────────────────────────────────────


@app.get("/health")
def health() -> HealthResponse:
    if engine is None:
        raise HTTPException(503, "RAG engine not initialized")
    return HealthResponse(
        status="healthy",
        documents_indexed=engine.collection.count(),
        medgemma_url=engine.medgemma_url,
    )


@app.post("/summarize", response_model=SummaryResponse)
def summarize(req: SummaryRequest) -> SummaryResponse:
    if engine is None:
        raise HTTPException(503, "RAG engine not initialized")

    start = time.perf_counter()

    prediction_data = {
        "prediction": req.prediction,
        "confidence": req.confidence,
        "risk_level": req.risk_level,
        "probabilities": req.probabilities,
        "abcd_features": req.abcd_features.model_dump(),
        "clinical_text": req.clinical_text,
    }

    summary = engine.generate_summary(prediction_data)
    elapsed_ms = int((time.perf_counter() - start) * 1000)

    return SummaryResponse(
        summary=summary,
        sources_used=engine.top_k,
        generation_time_ms=elapsed_ms,
    )
