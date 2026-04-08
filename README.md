# derm-platform

Production-grade web platform for multimodal skin cancer detection, powered by MedSigLIP vision encoding, ClinicalBERT text encoding, and MedGemma RAG-based clinical summaries.

## Architecture

```
Frontend (Next.js) → Gateway (Go) → Inference (Python/FastAPI)
                                   → RAG (Python/FastAPI) → MedGemma (llama.cpp)
                                                           → ChromaDB (ClinicalBERT embeddings)
```

## Services

| Service | Stack | Port | Description |
|---------|-------|------|-------------|
| Gateway | Go 1.22+ | 8080 | Request routing, validation, CORS, file upload handling |
| Inference | Python / FastAPI | 8081 | MedSigLIP + ClinicalBERT + ABCD fusion model |
| RAG | Python / FastAPI | 8082 | Retrieval-augmented clinical summary generation |
| MedGemma | llama.cpp (GGUF) | 8083 | Medical LLM for grounded clinical text generation |
| Frontend | Next.js + shadcn/ui | 3000 | Clinical analysis UI with explainability dashboard |

## Quick Start

### Prerequisites

- Docker Desktop with **14GB+ memory** allocated
- [HuggingFace account](https://huggingface.co/settings/tokens) with access to:
  - [google/medsiglip-448](https://huggingface.co/google/medsiglip-448) (gated)
  - [google/medgemma-4b-it](https://huggingface.co/google/medgemma-4b-it) (gated)

### Setup

```bash
# 1. Clone
git clone https://github.com/multimodal-derm/derm-platform.git
cd derm-platform

# 2. Add environment variables
echo "HF_TOKEN=hf_your_token_here" > .env

# 3. Download model weights
# Place best.pt in model/
mkdir -p model/medgemma
# Download MedGemma GGUF:
hf download lmstudio-community/medgemma-4b-it-GGUF medgemma-4b-it-Q4_K_M.gguf --local-dir model/medgemma

# 4. Start all services
docker compose up --build
```

The app will be available at [http://localhost:3000](http://localhost:3000). First startup takes 2–3 minutes while models load.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/v1/predict` | Multimodal skin lesion classification |
| `POST` | `/api/v1/summarize` | RAG clinical summary via MedGemma |
| `GET` | `/api/v1/health` | Gateway + inference health check |
| `GET` | `/api/v1/model/info` | Model metadata |

## Project Structure

```
derm-platform/
├── docker-compose.yml
├── .env.example
├── model/
│   ├── best.pt                              # Trained model checkpoint
│   └── medgemma/
│       └── medgemma-4b-it-Q4_K_M.gguf      # MedGemma GGUF weights
├── gateway/                                  # Go API gateway
│   ├── main.go
│   ├── Dockerfile
│   ├── handlers/
│   │   ├── predict.go
│   │   ├── summarize.go
│   │   └── health.go
│   ├── middleware/
│   │   ├── cors.go
│   │   └── logging.go
│   └── config/
│       └── config.go
├── inference/                                # Python inference service
│   ├── main.py
│   ├── engine.py
│   ├── model.py
│   ├── requirements.txt
│   └── Dockerfile
├── rag/                                      # RAG clinical summary service
│   ├── main.py
│   ├── engine.py
│   ├── knowledge.py
│   ├── requirements.txt
│   └── Dockerfile
└── frontend/                                 # Next.js clinical UI
    ├── app/
    │   ├── page.tsx
    │   └── analyze/page.tsx
    ├── components/
    │   ├── results-dashboard.tsx
    │   ├── medical-loading-screen.tsx
    │   └── app-initializer.tsx
    └── lib/
        ├── api.ts
        ├── types.ts
        └── use-three-scene.ts
```

## Model Pipeline

```
Image → MedSigLIP [1152-dim] ─┐
                               ├→ Cross-Attention → Late Fusion [270] → MLP → 6 Classes
Text  → ClinicalBERT [768-dim]┘                          ↑
ABCD  → 14 handcrafted features ─────────────────────────┘
```

**6 classes:** ACK (Actinic Keratosis), BCC (Basal Cell Carcinoma), MEL (Melanoma), NEV (Nevus), SCC (Squamous Cell Carcinoma), SEK (Seborrheic Keratosis)

**Training results:** Macro F1 = 0.7558, ROC-AUC = 0.9494, Accuracy = 74.1%

## RAG Pipeline

After classification, the system generates a clinical summary:

1. **Retrieve** — ClinicalBERT embeddings query ChromaDB (28 dermatology knowledge documents)
2. **Generate** — MedGemma 4B synthesizes a grounded clinical summary from retrieved context
3. **Display** — Summary rendered with typewriter effect in the results dashboard

## Related

- Model training repo: [multimodal-derm/multimodal-skin-cancer-detection](https://github.com/multimodal-derm/multimodal-skin-cancer-detection)
- Dataset: [PAD-UFES-20](https://data.mendeley.com/datasets/zr7vgbcyr2/1) (2,298 images, 6 classes)

## Team

Northeastern University — CS5330 / CS6120 / ML Capstone
