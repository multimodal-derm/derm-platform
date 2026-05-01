# derm-platform

Production-grade web platform for multimodal skin cancer detection, powered by MedSigLIP vision encoding, ClinicalBERT text encoding, and MedGemma RAG-based clinical summaries.

## ⚠️ Disclaimer

**This project is for educational and research purposes only.** It is not a medical device, has not been validated for clinical use, and must not be used to diagnose, treat, or make decisions about any real medical condition. The model was trained on a single dataset (PAD-UFES-20, 2,298 images) and has known limitations — including a low SCC F1 score (0.43), limited fairness validation across Fitzpatrick skin types, and no cross-validation. Always consult a licensed dermatologist for any skin health concerns.

## Architecture

```mermaid
graph LR
    Frontend[Frontend<br/>Next.js<br/>:3000] --> Gateway[Gateway<br/>Go<br/>:8080]
    Gateway --> Inference[Inference<br/>FastAPI<br/>:8081]
    Gateway --> RAG[RAG<br/>FastAPI<br/>:8082]
    RAG --> MedGemma[MedGemma<br/>llama.cpp<br/>:8083]
    RAG --> Chroma[ChromaDB<br/>ClinicalBERT embeddings]

    classDef frontend fill:#10b981,stroke:#047857,color:#fff
    classDef gateway fill:#3b82f6,stroke:#1e40af,color:#fff
    classDef python fill:#f59e0b,stroke:#b45309,color:#fff
    classDef storage fill:#8b5cf6,stroke:#6d28d9,color:#fff

    class Frontend frontend
    class Gateway gateway
    class Inference,RAG,MedGemma python
    class Chroma storage
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

```mermaid
graph LR
    Root[derm-platform]
    Root --> Compose[docker-compose.yml]
    Root --> Env[.env.example]
    Root --> Model[model/]
    Root --> Gateway[gateway/]
    Root --> Inference[inference/]
    Root --> RAG[rag/]
    Root --> Frontend[frontend/]

    Model --> BestPT[best.pt]
    Model --> MedGemmaDir[medgemma/]
    MedGemmaDir --> GGUF[medgemma-4b-it-Q4_K_M.gguf]

    Gateway --> GMain[main.go]
    Gateway --> GDocker[Dockerfile]
    Gateway --> GHandlers[handlers/]
    Gateway --> GMiddleware[middleware/]
    Gateway --> GConfig[config/]
    GHandlers --> GPredict[predict.go]
    GHandlers --> GSummarize[summarize.go]
    GHandlers --> GHealth[health.go]

    Inference --> IMain[main.py]
    Inference --> IEngine[engine.py]
    Inference --> IModel[model.py]
    Inference --> IDocker[Dockerfile]

    RAG --> RMain[main.py]
    RAG --> REngine[engine.py]
    RAG --> RKnowledge[knowledge.py]
    RAG --> RDocker[Dockerfile]

    Frontend --> FApp[app/]
    Frontend --> FComponents[components/]
    Frontend --> FLib[lib/]
    FApp --> FPage[page.tsx]
    FApp --> FAnalyze[analyze/page.tsx]
    FComponents --> FResults[results-dashboard.tsx]
    FComponents --> FLoading[medical-loading-screen.tsx]
    FComponents --> FInit[app-initializer.tsx]
    FLib --> FApi[api.ts]
    FLib --> FTypes[types.ts]
    FLib --> FThree[use-three-scene.ts]

    classDef root fill:#1f2937,stroke:#fff,stroke-width:2px,color:#fff
    classDef service fill:#3b82f6,stroke:#1e40af,color:#fff
    classDef file fill:#f3f4f6,stroke:#9ca3af,color:#111
    classDef dir fill:#fef3c7,stroke:#d97706,color:#111

    class Root root
    class Gateway,Inference,RAG,Frontend service
    class Model,MedGemmaDir,GHandlers,GMiddleware,GConfig,FApp,FComponents,FLib dir
    class Compose,Env,BestPT,GGUF,GMain,GDocker,GPredict,GSummarize,GHealth,IMain,IEngine,IModel,IDocker,RMain,REngine,RKnowledge,RDocker,FPage,FAnalyze,FResults,FLoading,FInit,FApi,FTypes,FThree file
```

## Model Pipeline

```mermaid
graph LR
    Img[Dermoscopic Image] --> SigLIP[MedSigLIP<br/>1152-dim]
    Txt[Patient Narrative] --> BERT[ClinicalBERT<br/>768-dim]
    ABCD[ABCD Features<br/>14-dim] --> Fusion

    SigLIP --> Cross[Cross-Attention<br/>8 heads]
    BERT --> Cross
    Cross --> Fusion[Late Fusion<br/>270-dim]
    Fusion --> MLP[MLP Head<br/>512 → 256 → 6]
    MLP --> Out[6 Classes:<br/>ACK • BCC • MEL<br/>NEV • SCC • SEK]

    classDef input fill:#10b981,stroke:#047857,color:#fff
    classDef encoder fill:#3b82f6,stroke:#1e40af,color:#fff
    classDef fusion fill:#f59e0b,stroke:#b45309,color:#fff
    classDef output fill:#8b5cf6,stroke:#6d28d9,color:#fff

    class Img,Txt,ABCD input
    class SigLIP,BERT encoder
    class Cross,Fusion,MLP fusion
    class Out output
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

## License

This project is released for educational and research use only. Not licensed for clinical or commercial use.

## Team


<table>
  <tr>
    <td align="center">
      <a href="https://github.com/akashshetty1997">
        <img src="https://github.com/akashshetty1997.png" width="80" height="80" style="border-radius: 50%" /><br />
        <sub><b>Akash Shetty</b></sub>
      </a><br />
      <sub>Team Lead • NLP • Platform</sub>
    </td>
    <td align="center">
      <a href="https://github.com/Sourav-02121996">
        <img src="https://github.com/Sourav-02121996.png" width="80" height="80" style="border-radius: 50%" /><br />
        <sub><b>Sourav Das</b></sub>
      </a><br />
      <sub>Vision Encoder • Training • XAI</sub>
    </td>
    <td align="center">
      <a href="https://github.com/MSKANDHAN-MADHUSUDHANA">
        <img src="https://github.com/MSKANDHAN-MADHUSUDHANA.png" width="80" height="80" style="border-radius: 50%" /><br />
        <sub><b>Skandhan M</b></sub>
      </a><br />
      <sub>CV Pipeline • ABCD Features</sub>
    </td>
    <td align="center">
      <a href="https://github.com/jchacker5">
        <img src="https://github.com/jchacker5.png" width="80" height="80" style="border-radius: 50%" /><br />
        <sub><b>Joseph M Defendre</b></sub>
      </a><br />
      <sub>Metrics • Segmentation • Fairness</sub>
    </td>
    <td align="center">
      <a href="https://github.com/NithishBhat">
        <img src="https://github.com/NithishBhat.png" width="80" height="80" style="border-radius: 50%" /><br />
        <sub><b>Nithish Bhat</b></sub>
      </a><br />
      <sub>Fusion Module • Focal Loss</sub>
    </td>
  </tr>
</table>
