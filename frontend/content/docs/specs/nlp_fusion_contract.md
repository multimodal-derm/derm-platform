# NLP ↔ Fusion Interface Contract

> **Status:** Active
> **Owner:** Akash
> **Reviewers:** Rahul (NLP), Nitesh (ML/Fusion), Sourav (CV)
> **Last Updated:** 2026-03-16

---

## 1. Purpose

This document defines the interface between the NLP pipeline outputs and the
Fusion module inputs. All teams **must build against this spec** to ensure
seamless integration.

---

## 2. Input: Metadata Columns → NLP Pipeline

### 2.1 PAD-UFES-20 Columns

| Column              | Type        | Route              | Notes                                     |
|---------------------|-------------|--------------------|--------------------------------------------|
| `age`               | int         | Text-ify           | Included in clinical note                  |
| `sex`               | categorical | Text-ify           | Included in clinical note                  |
| `smoke`             | bool        | Text-ify           | Risk factor for SCC                        |
| `drink`             | bool        | Text-ify           | Risk factor                                |
| `background_father` | bool        | Text-ify           | Family history of skin cancer              |
| `itch`              | bool        | Text-ify           | Symptom — high diagnostic weight           |
| `bleed`             | bool        | Text-ify           | Symptom — high diagnostic weight           |
| `hurt`              | bool        | Text-ify           | Symptom                                    |
| `elevation`         | bool        | Text-ify           | Morphological feature                      |
| `grew`              | bool        | Text-ify           | Growth indicator — high diagnostic weight  |
| `region`            | categorical | Text-ify           | Anatomic site; mapped to standard vocab    |
| `fitzpatrick`       | int (1–6)   | Fairness only      | Mapped to MST bin (Light/Medium/Dark)      |
| `diagnostic`        | categorical | **Label only**     | Never passed as feature                    |

### 2.2 ISIC 2024 Columns

| Column                   | Type        | Route     | Notes                              |
|--------------------------|-------------|-----------|-------------------------------------|
| `age_approx`             | int         | Text-ify  | 5-year bins                         |
| `sex`                    | categorical | Text-ify  | One-hot                             |
| `anatom_site_general`    | categorical | Text-ify  | Map to shared vocab with PAD-UFES   |
| `clin_size_long_diam_mm` | float       | Text-ify  | Relevant to ABCD rule               |

### 2.3 Shared Anatomic Site Vocabulary

Both datasets must map to a unified set:

```python
ANATOMIC_SITES = [
    "head_neck", "upper_extremity", "lower_extremity",
    "anterior_torso", "posterior_torso", "palms_soles", "lateral_torso"
]
```

---

## 3. NLP Pipeline Outputs

The NLP pipeline produces **one** output tensor per sample passed to the
Fusion module. The text encoder is selected from the 10-model benchmark
(see §3.3).

### 3.1 Clinical Note Embedding (from benchmark-winning text encoder)

| Property          | Value                                                    |
|-------------------|----------------------------------------------------------|
| **Source**        | Text-ified clinical note string                          |
| **Model**         | Winner of 10-model benchmark (TBD — see §3.3)           |
| **Extraction**    | Sentence-level embedding from winning encoder            |
| **Shape**         | `(batch_size, 768)` for 768-dim models                  |
| **Dtype**         | `torch.float32`                                          |
| **Variable name** | `text_embedding`                                         |

> **Note:** Qwen3-Embedding-0.6B and Jina-v5-text-small produce 1024-dim
> embeddings but have 30x slower inference (~40 min vs ~75s). If either wins
> the benchmark, prefer the fastest 768-dim model with comparable performance.

### 3.2 Raw Clinical Note String (optional, for generative path)

| Property          | Value                                                    |
|-------------------|----------------------------------------------------------|
| **Source**        | Text-ification template output                           |
| **Format**        | Python `str`, UTF-8                                      |
| **Max length**    | 512 tokens (ClinicalBERT max)                            |
| **Variable name** | `clinical_note_text`                                     |
| **Usage**         | Passed to generative pipeline only                       |

### 3.3 Text Encoder Benchmark

Ten models were evaluated on all 2,298 PAD-UFES-20 clinical notes. The winner
is selected based on linear probe AUC, silhouette score, and inference latency.

| Category             | Models                                              |
|----------------------|-----------------------------------------------------|
| Medical, contrastive | MedTE, MedEmbed-Base, BioSimCSE                     |
| General, contrastive | GTE-Base, BGE-Base, Qwen3-0.6B, Jina-v5-small      |
| Medical, no contrast | ClinicalBERT, Bio-ClinicalBERT, BiomedBERT          |

Embeddings are pre-computed as `.npy` arrays of shape `(2298, D)` in
`outputs/multi_model_pad_ufes20/`. The winning model is loaded at training
time via the `TEXT_ENCODER_MODEL` constant.

---

## 4. Fusion Module Expectations

### 4.1 Three-Stream Input Contract

The Fusion module receives three inputs per batch:

```python
# Stream 1 — Vision (from MedSigLIP vision encoder)
image_tokens: torch.Tensor     # shape: (B, 1024, 1152)

# Stream 2 — Text (from winning text encoder)
text_embedding: torch.Tensor   # shape: (B, 768)

# Stream 3 — ABCD handcrafted features
abcd_features: torch.Tensor    # shape: (B, N_abcd)  # N_abcd ~10
```

### 4.2 Cross-Attention Fusion (Primary)

Text embeddings serve as Query. Image patch tokens serve as Key and Value.
ABCD features are late-fused after cross-attention pooling.

```python
# Project to shared attention dimension d_k = 256
Q = nn.Linear(768, 256)(text_embedding).unsqueeze(1)   # (B, 1, 256)
K = nn.Linear(1152, 256)(image_tokens)                  # (B, 1024, 256)
V = nn.Linear(1152, 256)(image_tokens)                  # (B, 1024, 256)

# Cross-attention
Z = MultiheadAttention(Q, K, V)                         # (B, 1, 256)
Z_pooled = Z.squeeze(1)                                 # (B, 256)

# ABCD late fusion
abcd_proj = nn.Linear(N_abcd, 256)(abcd_features)       # (B, 256)
fused = torch.cat([Z_pooled, abcd_proj], dim=-1)        # (B, 512)

# Classification head
logits = MLP(fused)  # 512 → 256 → 6
```

### 4.3 Late Fusion Baseline (Concatenation — ablation only)

```python
image_pool = vision_encoder(images)  # (B, 1152) pooled
fused = torch.cat([image_pool, text_embedding], dim=-1)
# Shape: (B, 1152 + 768) = (B, 1920)
logits = MLP(fused)  # 1920 → 512 → 6
```

---

## 5. Text-ification Template

The NLP team produces clinical note strings using this template.

```python
TEMPLATE = (
    "A {age}-year-old {sex} presents with a skin lesion on the {region}. "
    "{symptom_sentence}"
    "{risk_sentence}"
    "{size_sentence}"
)

# Example symptom_sentence:
# "The patient reports itching and bleeding associated with the lesion. "
# If no symptoms: "The patient denies associated symptoms. "

# Example risk_sentence:
# "The patient has a history of smoking and a family history of skin cancer. "
# If no risk factors: ""

# Example size_sentence (ISIC only):
# "Clinical examination reveals a lesion measuring approximately 8mm. "
```

**Owner:** Rahul builds and owns the text-ification function.
**Signature:**

```python
def textify_metadata(row: dict[str, Any]) -> str:
    """Convert a metadata row into a clinical note string.

    Args:
        row: Dict with keys matching columns from §2.
             Missing keys are treated as unknown/absent.

    Returns:
        Clinical note string, max ~100 words.
    """
```

---

## 6. Data Flow Diagram

```
┌─────────────┐     ┌──────────────┐     ┌──────────────────────┐
│ Raw Metadata │────▶│  Text-ify    │────▶│  Text Encoder        │──▶ text_embedding
│  (tabular)   │     │  (template)  │     │  (benchmark winner)  │    (B, 768)
└──────────────┘     └──────────────┘     └──────────────────────┘

┌─────────────┐     ┌──────────────┐
│  Raw Image   │────▶│  MedSigLIP   │──▶ image_tokens (B, 1024, 1152)
│  (448×448)   │     │  vision enc. │
└─────────────┘     └──────────────┘

┌─────────────┐     ┌──────────────┐
│  Lesion mask │────▶│  ABCD module │──▶ abcd_features (B, ~10)
│  (segmented) │     │  (handcraft) │
└─────────────┘     └──────────────┘

                    ┌───────────────────────────────────────────┐
  All three ───────▶│  Fusion Module                            │──▶ logits (B, 6)
                    │  Cross-Attention (text Q, image K/V)      │
                    │  + ABCD late fusion                       │
                    │  + MLP head 512 → 256 → 6                 │
                    └───────────────────────────────────────────┘
```

---

## 7. Constants (shared across modules)

```python
# src/common/constants.py

TEXT_EMBED_DIM = 768          # Text encoder output dim (768-dim models)
IMAGE_FEATURE_DIM = 1152      # MedSigLIP patch feature dim (true hidden size)
MEDSIGLIP_PATCH_SIZE = 14     # Patch size for google/medsiglip-448
IMAGE_SPATIAL_DIM = 32        # Spatial feature grid height/width (448 // 14)
IMAGE_TOKEN_COUNT = 1024      # IMAGE_SPATIAL_DIM ** 2
FUSION_DIM = 256              # Cross-attention projection dim (d_k)
MAX_TOKEN_LENGTH = 512        # Max tokens for text encoder
MEDSIGLIP_MODEL_NAME = "google/medsiglip-448"
```

---

## 8. Changelog

| Date       | Change                                                        | Author |
|------------|---------------------------------------------------------------|--------|
| 2026-03-16 | Updated text encoder to benchmark-winner approach (10 models) | Akash  |
| 2026-03-16 | Replaced tabular MLP stream with ABCD features stream         | Akash  |
| 2026-03-16 | Updated cross-attention spec with correct Q/K/V shapes        | Akash  |
| 2026-03-16 | Fixed baseline concat dim: 1792 → 1920 (1152 + 768)          | Akash  |
| 2026-03-16 | Updated FUSION_DIM to 256 (cross-attention d_k)               | Akash  |
| 2026-03-14 | Initial draft                                                 | Akash  |```markdown
# NLP ↔ Fusion Interface Contract

> **Status:** Active
> **Owner:** Akash
> **Reviewers:** Rahul (NLP), Nitesh (ML/Fusion), Sourav (CV)
> **Last Updated:** 2026-03-19

---

## 1. Purpose

This document defines the interface between the NLP pipeline outputs and the
Fusion module inputs. All teams **must build against this spec** to ensure
seamless integration.

---

## 2. Input: Metadata Columns → NLP Pipeline

### 2.1 PAD-UFES-20 Columns

| Column              | Type        | Route              | Notes                                     |
|---------------------|-------------|--------------------|--------------------------------------------|
| `age`               | int         | Text-ify           | Included in clinical note                  |
| `sex`               | categorical | Text-ify           | Included in clinical note                  |
| `smoke`             | bool        | Text-ify           | Risk factor for SCC                        |
| `drink`             | bool        | Text-ify           | Risk factor                                |
| `background_father` | bool        | Text-ify           | Family history of skin cancer              |
| `itch`              | bool        | Text-ify           | Symptom — high diagnostic weight           |
| `bleed`             | bool        | Text-ify           | Symptom — high diagnostic weight           |
| `hurt`              | bool        | Text-ify           | Symptom                                    |
| `elevation`         | bool        | Text-ify           | Morphological feature                      |
| `grew`              | bool        | Text-ify           | Growth indicator — high diagnostic weight  |
| `region`            | categorical | Text-ify           | Anatomic site; mapped to standard vocab    |
| `fitzpatrick`       | int (1–6)   | Fairness only      | Mapped to MST bin (Light/Medium/Dark)      |
| `diagnostic`        | categorical | **Label only**     | Never passed as feature                    |

### 2.2 ISIC 2024 Columns

| Column                   | Type        | Route     | Notes                              |
|--------------------------|-------------|-----------|-------------------------------------|
| `age_approx`             | int         | Text-ify  | 5-year bins                         |
| `sex`                    | categorical | Text-ify  | One-hot                             |
| `anatom_site_general`    | categorical | Text-ify  | Map to shared vocab with PAD-UFES   |
| `clin_size_long_diam_mm` | float       | Text-ify  | Relevant to ABCD rule               |

### 2.3 Shared Anatomic Site Vocabulary

Both datasets must map to a unified set:

```python
ANATOMIC_SITES = [
    "head_neck", "upper_extremity", "lower_extremity",
    "anterior_torso", "posterior_torso", "palms_soles", "lateral_torso"
]
```

---

## 3. NLP Pipeline Outputs

The NLP pipeline produces **one** output tensor per sample passed to the
Fusion module. The text encoder was selected from a 10-model benchmark
(see §3.3).

### 3.1 Clinical Note Embedding

| Property          | Value                                                    |
|-------------------|----------------------------------------------------------|
| **Source**        | Text-ified clinical note string                          |
| **Model**         | ClinicalBERT (`medicalai/ClinicalBERT`)         |
| **Extraction**    | Mean-pooled sentence embedding                           |
| **Shape**         | `(batch_size, 768)`                                      |
| **Dtype**         | `torch.float32`                                          |
| **Variable name** | `text_embedding`                                         |

### 3.2 Raw Clinical Note String (optional, for generative path)

| Property          | Value                                                    |
|-------------------|----------------------------------------------------------|
| **Source**        | Text-ification template output                           |
| **Format**        | Python `str`, UTF-8                                      |
| **Max length**    | 512 tokens (ClinicalBERT tokenizer)                  |
| **Variable name** | `clinical_note_text`                                     |
| **Usage**         | Passed to generative pipeline only                       |

### 3.3 Text Encoder Benchmark

Ten models were evaluated on all 2,298 PAD-UFES-20 clinical notes. The winner
was selected based on linear probe AUC, silhouette score, inference latency,
and external benchmark performance (MedTEB).

| Category             | Models                                              |
|----------------------|-----------------------------------------------------|
| Medical, contrastive | MedTE, MedEmbed-Base, BioSimCSE                     |
| General, contrastive | GTE-Base, BGE-Base, Qwen3-0.6B, Jina-v5-small      |
| Medical, no contrast | ClinicalBERT, Bio-ClinicalBERT, BiomedBERT          |

**Selected model:** ClinicalBERT (medicalai/ClinicalBERT) — fastest 768-dim model, 0.7410 macro F1 on PAD-UFES-20
(0.578 avg across 51 medical tasks), 768-dim, contrastive-trained on GTE-base
with 2M+ medical text pairs, ~76s inference for 2,298 samples. Pending final
confirmation via downstream classification benchmark (#71).

**Selection rule:** Prefer the fastest 768-dim model unless a 1024-dim model
shows strictly superior downstream classification performance. Qwen3-0.6B and
Jina-v5-small (both 1024-dim) were 33× slower (~40 min vs ~76s) with no
meaningful performance advantage.

Embeddings are pre-computed as `.npy` arrays of shape `(2298, D)` in
`outputs/multi_model_pad_ufes20/`. The selected model is loaded at training
time via the `TEXT_ENCODER_MODEL` constant.

**Reference:** Khodadad, M., Shiraee Kasmaee, A., Astaraki, M., & Mahyar, H.
(2025). Towards Domain Specification of Embedding Models in Medicine.
arXiv:2507.19407v2.

---

## 4. Fusion Module Expectations

### 4.1 Three-Stream Input Contract

The Fusion module receives three inputs per batch:

```python
# Stream 1 — Vision (from MedSigLIP vision encoder)
image_tokens: torch.Tensor     # shape: (B, 1024, 1152)

# Stream 2 — Text (from ClinicalBERT)
text_embedding: torch.Tensor   # shape: (B, 768)

# Stream 3 — ABCD handcrafted features
abcd_features: torch.Tensor    # shape: (B, N_abcd)  # N_abcd ~10
```

### 4.2 Cross-Attention Fusion (Primary)

Text embeddings serve as Query. Image patch tokens serve as Key and Value.
ABCD features are late-fused after cross-attention pooling.

```python
# Project to shared attention dimension d_k = 256
Q = nn.Linear(768, 256)(text_embedding).unsqueeze(1)   # (B, 1, 256)
K = nn.Linear(1152, 256)(image_tokens)                  # (B, 1024, 256)
V = nn.Linear(1152, 256)(image_tokens)                  # (B, 1024, 256)

# Cross-attention
Z = MultiheadAttention(Q, K, V)                         # (B, 1, 256)
Z_pooled = Z.squeeze(1)                                 # (B, 256)

# ABCD late fusion
abcd_proj = nn.Linear(N_abcd, 256)(abcd_features)       # (B, 256)
fused = torch.cat([Z_pooled, abcd_proj], dim=-1)        # (B, 512)

# Classification head
logits = MLP(fused)  # 512 → 256 → 6
```

### 4.3 Late Fusion Baseline (Concatenation — ablation only)

```python
image_pool = vision_encoder(images)  # (B, 1152) pooled
fused = torch.cat([image_pool, text_embedding], dim=-1)
# Shape: (B, 1152 + 768) = (B, 1920)
logits = MLP(fused)  # 1920 → 512 → 6
```

---

## 5. Text-ification Template

The NLP team produces clinical note strings using this template.

```python
TEMPLATE = (
    "A {age}-year-old {sex} presents with a skin lesion on the {region}. "
    "{symptom_sentence}"
    "{risk_sentence}"
    "{size_sentence}"
)

# Example symptom_sentence:
# "The patient reports itching and bleeding associated with the lesion. "
# If no symptoms: "The patient denies associated symptoms. "

# Example risk_sentence:
# "The patient has a history of smoking and a family history of skin cancer. "
# If no risk factors: ""

# Example size_sentence (ISIC only):
# "Clinical examination reveals a lesion measuring approximately 8mm. "
```

**Owner:** Rahul builds and owns the text-ification function.
**Signature:**

```python
def textify_metadata(row: dict[str, Any]) -> str:
    """Convert a metadata row into a clinical note string.

    Args:
        row: Dict with keys matching columns from §2.
             Missing keys are treated as unknown/absent.

    Returns:
        Clinical note string, max ~100 words.
    """
```

---

## 6. Data Flow Diagram

```
┌─────────────┐     ┌──────────────┐     ┌──────────────────────┐
│ Raw Metadata │────▶│  Text-ify    │────▶│  ClinicalBERT         │──▶ text_embedding
│  (tabular)   │     │  (template)  │     │  (768-dim, cl15)     │    (B, 768)
└──────────────┘     └──────────────┘     └──────────────────────┘

┌─────────────┐     ┌──────────────┐
│  Raw Image   │────▶│  MedSigLIP   │──▶ image_tokens (B, 1024, 1152)
│  (448×448)   │     │  vision enc. │
└─────────────┘     └──────────────┘

┌─────────────┐     ┌──────────────┐
│  Lesion mask │────▶│  ABCD module │──▶ abcd_features (B, ~10)
│  (segmented) │     │  (handcraft) │
└─────────────┘     └──────────────┘

                    ┌───────────────────────────────────────────┐
  All three ───────▶│  Fusion Module                            │──▶ logits (B, 6)
                    │  Cross-Attention (text Q, image K/V)      │
                    │  + ABCD late fusion                       │
                    │  + MLP head 512 → 256 → 6                 │
                    └───────────────────────────────────────────┘
```

---

## 7. Constants (shared across modules)

```python
# src/common/constants.py

TEXT_ENCODER_MODEL = "medicalai/ClinicalBERT"
TEXT_EMBED_DIM = 768          # ClinicalBERT output dim
IMAGE_FEATURE_DIM = 1152      # MedSigLIP patch feature dim (true hidden size)
MEDSIGLIP_PATCH_SIZE = 14     # Patch size for google/medsiglip-448
IMAGE_SPATIAL_DIM = 32        # Spatial feature grid height/width (448 // 14)
IMAGE_TOKEN_COUNT = 1024      # IMAGE_SPATIAL_DIM ** 2
FUSION_DIM = 256              # Cross-attention projection dim (d_k)
MAX_TOKEN_LENGTH = 512        # Max tokens for ClinicalBERT
MEDSIGLIP_MODEL_NAME = "google/medsiglip-448"
```

---

## 8. Changelog

| Date       | Change                                                        | Author |
|------------|---------------------------------------------------------------|--------|
| 2026-03-19 | Locked ClinicalBERT as text encoder per #82, updated §3.1/3.2/3.3/6/7       | Akash  |
| 2026-03-16 | Updated text encoder to benchmark-winner approach (10 models) | Akash  |
| 2026-03-16 | Replaced tabular MLP stream with ABCD features stream         | Akash  |
| 2026-03-16 | Updated cross-attention spec with correct Q/K/V shapes        | Akash  |
| 2026-03-16 | Fixed baseline concat dim: 1792 → 1920 (1152 + 768)          | Akash  |
| 2026-03-16 | Updated FUSION_DIM to 256 (cross-attention d_k)               | Akash  |
| 2026-03-14 | Initial draft                                                 | Akash  |
```