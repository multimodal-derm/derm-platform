
# Dataset — PAD-UFES-20

## Overview

PAD-UFES-20 is a clinical skin lesion dataset collected at the Federal
University of Espírito Santo, Brazil. It contains 2,298 smartphone images
with 26 tabular clinical features per sample.

## Source

**Primary:** Mendeley `metadata.csv` (DOI: https://data.mendeley.com/datasets/zr7vgbcyr2/1)

> **Important:** Do not use the ISIC Archive API version — it uses
> `ISIC_`-prefixed IDs that are incompatible with the Mendeley metadata.
> All label and metadata joins must use the Mendeley CSV.

**Secondary:** ISIC Archive Collection 406 (https://api.isic-archive.com/collections/406/) — used for supplementary data only, not for labels.

## Classes (6)

| Code | Diagnosis | Type |
|------|-----------|------|
| ACK | Actinic Keratosis | Pre-malignant |
| BCC | Basal Cell Carcinoma | Malignant |
| MEL | Melanoma | Malignant |
| NEV | Melanocytic Nevus | Benign |
| SCC | Squamous Cell Carcinoma | Malignant |
| SEK | Seborrheic Keratosis | Benign |

> **Known issue:** PAD-UFES-20 has severe class imbalance — NEV is
> overrepresented relative to MEL and SCC. Focal Loss (#42) is used
> during training to mitigate this.

## Metadata Columns (26)

### Used for Textification (NLP Stream)

| Column | Type | Notes |
|--------|------|-------|
| `age` | int | Patient age |
| `sex` | categorical | Male / Female |
| `region` | categorical | Anatomic site of lesion |
| `fitzpatrick` | int (1–6) | Skin type — also used for fairness auditing |
| `diameter_1` | float | Lesion diameter (mm) |
| `diameter_2` | float | Lesion diameter (mm) |
| `itch` | bool | Symptom — high diagnostic weight |
| `bleed` | bool | Symptom — high diagnostic weight |
| `hurt` | bool | Symptom |
| `grew` | bool | Growth indicator — high diagnostic weight |
| `changed` | bool | Appearance change over time |
| `elevation` | bool | Morphological feature |
| `smoke` | bool | Risk factor |
| `drink` | bool | Risk factor |
| `pesticide` | bool | Environmental exposure |
| `skin_cancer_history` | bool | Prior skin cancer |
| `cancer_history` | bool | Prior cancer of any type |
| `has_piped_water` | bool | Environmental factor |
| `has_sewage_system` | bool | Environmental factor |
| `background_father` | categorical | Family origin |
| `background_mother` | categorical | Family origin |
| `biopsy` | bool | Whether biopsy was performed |

### Label (not used as feature)

| Column | Type | Notes |
|--------|------|-------|
| `diagnostic` | categorical | Ground truth — one of ACK, BCC, MEL, NEV, SCC, SEK |

### Used for Fairness Only

| Column | Type | Notes |
|--------|------|-------|
| `fitzpatrick` | int (1–6) | Grouped for fairness audit — heavily skewed toward types I–III |

## Image Preprocessing

- **Resize:** 448×448 (MedSigLIP input size)
- **Normalization:** mean=0.5, std=0.5 per channel (MedSigLIP processor — not ImageNet stats)
- **Format:** RGB, `torch.float32`
- **Preprocessing stats:** Computed per-image only (no dataset-level statistics to prevent data leakage)

## Download

The benchmark and multimodal pipeline expect the Mendeley-aligned files:

```text
data/raw/
├── images/                 # <img_id>.<ext> files from the Mendeley release
└── mendeley_metadata.csv   # metadata CSV from Mendeley
```

Once those files are in place, build the merged metadata CSV used by the repo:

```bash
PYTHONPATH=. python scripts/download_mendeley_metadata.py \
  --mendeley-csv data/raw/mendeley_metadata.csv \
  --images-dir data/raw \
  --output data/raw/metadata_full.csv
```

## Row Alignment

When joining embeddings with labels, use `patient_id`, `lesion_id`, and
`img_id` from the embedding handoff's `embedding_index.csv` as the
authoritative row-order map. Row `i` in any `text_embedding.npy` corresponds
to row `i` in `embedding_index.csv`.
