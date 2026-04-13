# Getting Started

## Prerequisites

- Python 3.12+
- pip

## Installation
```bash
git clone git@github.com:multimodal-derm/multimodal-skin-cancer-detection.git
cd multimodal-skin-cancer-detection
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Pre-commit Hooks

The project uses Ruff for linting and formatting, enforced via pre-commit hooks:
```bash
pre-commit install
```

This runs `ruff check`, `ruff format`, and `pytest` import checks automatically on every commit.

## MedSigLIP Checkpoint Access

The vision encoder depends on the gated Hugging Face model `google/medsiglip-448`.

- Smoke tests fall back to a lightweight MedSigLIP-compatible backbone when
  authentication is missing.
- To require the real checkpoint, authenticate with Hugging Face and run:
```bash
MEDSIGLIP_LOAD_PRETRAINED=1 python -m src.cv.models.vision_encoder
```

## Download Dataset
> **Important:** Labels must come from the Mendeley `metadata.csv`
> (DOI: https://data.mendeley.com/datasets/zr7vgbcyr2/1). Do not use the
> ISIC API version — it uses incompatible `ISIC_`-prefixed IDs.

For the vision benchmark and multimodal pipeline, prepare this layout:

```text
data/raw/
├── images/                 # <img_id>.<ext> files from the Mendeley release
└── mendeley_metadata.csv   # metadata CSV from Mendeley
```

Then merge the metadata into the benchmark-ready CSV:

```bash
PYTHONPATH=. python scripts/download_mendeley_metadata.py \
  --mendeley-csv data/raw/mendeley_metadata.csv \
  --images-dir data/raw \
  --output data/raw/metadata_full.csv
```

The train/validation split is created automatically by the benchmark or via:

```bash
PYTHONPATH=. python -c "from src.cv.data.dataloaders import create_train_val_split; create_train_val_split()"
```

## Run Vision Benchmark

```bash
PYTHONPATH=. python -m src.cv.benchmarks.vision_benchmark \
  --metadata-csv data/raw/metadata_full.csv \
  --images-dir data/raw \
  --output-csv outputs/vision_benchmark_results.csv
```

## Run the Streamlit Demo
```bash
streamlit run demo/app.py
```

The demo currently uses a mocked inference backend. Once real model training
is complete (#78), swap to the real model via #79.

## Run the ResNet-18 Baseline

Issue #72 adds a standalone, from-scratch ResNet-18 classifier for PAD-UFES-20.

```bash
python -m src.cv.train_resnet_baseline \
  --train-csv data/processed/train.csv \
  --val-csv data/processed/val.csv \
  --images-dir data/raw \
  --output-dir outputs/resnet18_baseline
```

The trainer writes `best.pt`, `history.csv`, and `metrics.json` to the output
directory. A tracked benchmark report is available in
`docs/reports/resnet18_baseline.md`.

## Run Tests
```bash
pytest tests/ -v
```

Current test coverage: metrics module (43 tests), fairness module (24 tests).

## Project Structure
```
multimodal-skin-cancer-detection/
├── src/
│   ├── cv/          # Vision encoder, DataLoader, ABCD features, segmentation
│   ├── nlp/         # Clinical note generation + text encoding
│   ├── fusion/      # Cross-attention fusion module
│   └── common/      # Shared constants, metrics, fairness, losses, training
├── demo/
│   ├── app.py       # Streamlit entry point
│   ├── inference.py  # MockInferenceEngine (swap to real after training)
│   ├── shared.py    # Shared constants + inference wrapper
│   └── pages/       # Home, Run Demo, Results, Fairness, About
├── scripts/         # Preprocessing + download scripts
├── docs/            # Documentation (MkDocs Material)
├── tests/           # Unit tests (pytest)
└── data/            # Dataset (not tracked in git)
```

## Key Constants

All shared constants live in `src/common/constants.py`:
```python
MEDSIGLIP_MODEL_NAME = "google/medsiglip-448"
IMAGE_FEATURE_DIM = 1152      # MedSigLIP true hidden size (not 1024)
TEXT_EMBED_DIM = 768           # ClinicalBERT output dim
CROSS_ATTN_DK = 256           # Cross-attention projection dim
NUM_CLASSES = 6                # ACK, BCC, MEL, NEV, SCC, SEK
```
