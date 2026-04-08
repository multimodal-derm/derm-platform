"""
RAG engine — retrieval-augmented generation for clinical summaries.

1. ChromaDB stores dermatology knowledge chunks, embedded with ClinicalBERT.
2. Given a prediction result, retrieves the most relevant chunks.
3. Sends the grounding context + prediction to MedGemma for a clinical summary.
"""

import logging
from typing import Any

import chromadb
from chromadb.utils.embedding_functions import SentenceTransformerEmbeddingFunction
from openai import OpenAI

from knowledge import KNOWLEDGE_BASE

logger = logging.getLogger(__name__)

# ── Prompt template ──────────────────────────────────────────────────────────

SYSTEM_PROMPT = """\
You are a dermatology clinical decision-support assistant. Given a skin lesion \
classification result and retrieved clinical knowledge, write a concise summary \
that helps a clinician interpret the finding.

Rules:
- Focus on clinical INSIGHTS from the provided context, not repeating input data.
- Do NOT list the ABCD values, patient demographics, or probabilities back.
- Write in flowing prose paragraphs, not bullet points.
- Structure: 1) What this classification means clinically, 2) Key risk factors \
and differential considerations, 3) Recommended next steps, 4) Important caveats.
- Keep it under 300 words.
- End with a reminder this is AI-generated and not a diagnosis.
"""

USER_TEMPLATE = """\
CLASSIFICATION RESULT:
- Predicted: {prediction} ({prediction_full})
- Confidence: {confidence:.1%}
- Risk Level: {risk_level}
- Second most likely: {second_class} ({second_prob:.1%})

PATIENT CONTEXT:
{clinical_text}

RETRIEVED CLINICAL KNOWLEDGE:
{context}

Write a clinical summary focusing on what this finding means, relevant risk \
factors, and recommended next steps. Do not repeat the raw numbers above.
"""


class RAGEngine:
    """Retrieval-augmented generation engine."""

    def __init__(
        self,
        medgemma_url: str = "http://medgemma:8082",
        embed_model: str = "medicalai/ClinicalBERT",
        collection_name: str = "derm_knowledge",
        top_k: int = 5,
    ):
        self.top_k = top_k
        self.medgemma_url = medgemma_url

        # ── Embedding function (ClinicalBERT) ────────────────────────────
        logger.info("Loading embedding model: %s", embed_model)
        self.embed_fn = SentenceTransformerEmbeddingFunction(
            model_name=embed_model,
        )

        # ── ChromaDB ─────────────────────────────────────────────────────
        logger.info("Initializing ChromaDB")
        self.chroma = chromadb.Client()
        self.collection = self.chroma.get_or_create_collection(
            name=collection_name,
            embedding_function=self.embed_fn,
        )

        # Seed knowledge base if empty
        if self.collection.count() == 0:
            self._seed_knowledge()

        # ── MedGemma client (OpenAI-compatible) ──────────────────────────
        self.llm = OpenAI(
            base_url=f"{medgemma_url}/v1",
            api_key="not-needed",
        )

        logger.info(
            "RAG engine ready — %d documents indexed, MedGemma at %s",
            self.collection.count(),
            medgemma_url,
        )

    def _seed_knowledge(self) -> None:
        """Load dermatology knowledge base into ChromaDB."""
        logger.info("Seeding %d knowledge documents", len(KNOWLEDGE_BASE))
        self.collection.add(
            ids=[doc["id"] for doc in KNOWLEDGE_BASE],
            documents=[doc["text"] for doc in KNOWLEDGE_BASE],
            metadatas=[{"class": doc["class"]} for doc in KNOWLEDGE_BASE],
        )

    def retrieve(self, query: str, prediction_class: str) -> list[str]:
        """Retrieve relevant knowledge chunks for a prediction."""
        results = self.collection.query(
            query_texts=[query],
            n_results=self.top_k,
            where={"$or": [
                {"class": prediction_class},
                {"class": "GENERAL"},
            ]},
        )
        documents = results.get("documents", [[]])[0]
        return documents

    def generate_summary(self, prediction_data: dict[str, Any]) -> str:
        """
        Generate a grounded clinical summary.

        Parameters
        ----------
        prediction_data : dict
            Must contain: prediction, confidence, risk_level, probabilities,
            clinical_text, abcd_features.
        """
        prediction = prediction_data["prediction"]
        confidence = prediction_data["confidence"]

        # Find second most likely class
        probs = prediction_data.get("probabilities", {})
        sorted_probs = sorted(probs.items(), key=lambda x: -x[1])
        second_class = sorted_probs[1][0] if len(sorted_probs) > 1 else "N/A"
        second_prob = sorted_probs[1][1] if len(sorted_probs) > 1 else 0.0

        # Retrieve grounding context
        query = (
            f"{prediction} {self._class_full_name(prediction)} skin lesion "
            f"dermoscopy treatment risk factors"
        )
        docs = self.retrieve(query, prediction)
        context = "\n\n".join(f"[{i+1}] {doc}" for i, doc in enumerate(docs))

        if not context.strip():
            context = "No specific clinical context available."

        # Build the user prompt
        user_msg = USER_TEMPLATE.format(
            prediction=prediction,
            prediction_full=self._class_full_name(prediction),
            confidence=confidence,
            risk_level=prediction_data.get("risk_level", "UNKNOWN"),
            second_class=f"{second_class} ({self._class_full_name(second_class)})",
            second_prob=second_prob,
            clinical_text=prediction_data.get("clinical_text", "N/A"),
            context=context,
        )

        # Call MedGemma
        try:
            response = self.llm.chat.completions.create(
                model="medgemma",
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": user_msg},
                ],
                max_tokens=2048,
                temperature=0.3,
            )
            summary = response.choices[0].message.content
            return summary or "Unable to generate summary."
        except Exception as e:
            logger.error("MedGemma generation failed: %s", e)
            return f"Clinical summary generation failed: {e}"

    @staticmethod
    def _class_full_name(code: str) -> str:
        names = {
            "ACK": "Actinic Keratosis",
            "BCC": "Basal Cell Carcinoma",
            "MEL": "Melanoma",
            "NEV": "Nevus (Mole)",
            "SCC": "Squamous Cell Carcinoma",
            "SEK": "Seborrheic Keratosis",
        }
        return names.get(code, code)