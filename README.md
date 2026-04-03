# derm-platform

Production-grade web platform for multimodal skin cancer detection.

**Architecture:** Go API Gateway → Python Inference Service → Next.js Frontend (coming soon)

## Services

| Service | Stack | Port | Description |
|---------|-------|------|-------------|
| Gateway | Go 1.22+ | 8080 | Request routing, validation, CORS, file upload handling |
| Inference | Python / FastAPI | 8081 | Model loading, multimodal inference, XAI |
| Frontend | Next.js + shadcn/ui | 3000 | Clinical UI (coming soon) |

## Quick Start

```bash
# With Docker (recommended)
docker compose up --build

# Without Docker
# Terminal 1: Start inference service
cd inference && pip install -r requirements.txt && uvicorn main:app --port 8081

# Terminal 2: Start gateway
cd gateway && go run main.go
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/v1/predict` | Multimodal skin lesion classification |
| `GET` | `/api/v1/health` | Gateway + inference health check |
| `GET` | `/api/v1/model/info` | Model metadata |

## Project Structure

```
derm-platform/
├── docker-compose.yml
├── gateway/                # Go API gateway
│   ├── main.go
│   ├── go.mod
│   ├── Dockerfile
│   ├── handlers/
│   │   ├── predict.go
│   │   └── health.go
│   ├── middleware/
│   │   ├── cors.go
│   │   └── logging.go
│   └── config/
│       └── config.go
├── inference/              # Python inference microservice
│   ├── main.py
│   ├── engine.py
│   ├── schemas.py
│   ├── requirements.txt
│   └── Dockerfile
└── frontend/               # Next.js (coming soon)
```

## Related

- Model repo: [multimodal-derm/multimodal-skin-cancer-detection](https://github.com/multimodal-derm/multimodal-skin-cancer-detection)
- Dataset: PAD-UFES-20
