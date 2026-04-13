# NLP Proposal — Clinical Text Stream for Multimodal Skin Cancer Detection

**Project:** Multimodal Skin Cancer Detection (CV + ML + NLP)
**Course:** CS6120 (NLP)
**Owners:** Akash (lead), Rahul
**Repo:** https://github.com/multimodal-derm/multimodal-skin-cancer-detection
**Date:** 2026-02-09 (original) · 2026-03-19 (updated)
**Status:** Implementation complete — training pending

---

## 1. Problem Statement

The NLP component builds the **text stream** of a three-stream multimodal pipeline for skin lesion classification. It converts structured PAD-UFES-20 clinical metadata into natural-language clinical narratives, encodes them with a domain-specific medical text encoder, and feeds the resulting embeddings into a cross-attention fusion module where text queries attend over image patch tokens to produce visually-grounded diagnostic predictions.

The text stream serves two purposes: (1) providing clinical context that image analysis alone cannot capture (age, symptoms, risk factors, lesion history), and (2) enabling cross-attention explainability — the attention weights reveal which image regions the clinical context deemed most relevant.

---

## 2. Deliverables

1. **Clinical note generation** — template-based textification pipeline converting all 26 PAD-UFES-20 tabular features into structured clinical narratives for all 2,298 samples
2. **Text encoder selection** — 10-model embedding benchmark comparing medical and general-purpose encoders on PAD-UFES-20 clinical notes, with speed and dimensionality tradeoff analysis
3. **Text embeddings** — 768-dimensional embeddings from ClinicalBERT for all 2,298 samples, ready for cross-attention fusion
4. **Cross-attention explainability** — text-guided attention weights over MedSigLIP image patches (32×32 grid) showing which image regions the clinical narrative attended to during fusion

---

## 3. Dataset

**Primary dataset:** PAD-UFES-20 (2,298 smartphone images with 26 tabular clinical features)

**Source:** Mendeley metadata.csv (DOI: https://data.mendeley.com/datasets/zr7vgbcyr2/1)

> **Important:** The ISIC Archive API version uses incompatible `ISIC_`-prefixed IDs that do not align with the Mendeley metadata. All label and metadata joins must use the Mendeley CSV.

**Metadata columns used for textification:**
`age`, `sex`, `region`, `fitzpatrick`, `diameter_1`, `diameter_2`, `itch`, `grew`, `bleed`, `hurt`, `changed`, `elevation`, `smoke`, `drink`, `pesticide`, `skin_cancer_history`, `cancer_history`, `has_piped_water`, `has_sewage_system`, `biopsy`, `father_background`, `mother_background`

**Diagnostic classes (6):** ACK, BCC, MEL, NEV, SCC, SEK

---

## 4. Methodology

### 4.1 Clinical Note Generation (Textification)

A deterministic template-based pipeline converts each row of PAD-UFES-20 metadata into a structured English clinical narrative. The template covers demographics, lesion characteristics, symptoms, risk factors, family background, and environmental factors.

**Example output:**
> 67-year-old male patient presents with a skin lesion. Family background reports father GERMANY and mother GERMANY. The lesion is located on the nose. Approximate size is 15.0 mm by 11.0 mm. Fitzpatrick skin type is 2. The lesion is elevated. Itching is denied. Bleeding is reported. Pain is denied. The lesion has increased in size over time. The patient reports smoking. The patient denies alcohol use.

**Design decisions:**
- Template-based over LLM-generated: deterministic, reproducible, zero inference cost, and no hallucination risk. The original proposal considered LLM-enhanced notes (Llama 3 / ClinicalBERT generation), but template output proved sufficient — the text encoder benchmark showed strong embedding quality from template notes without requiring richer generation.
- Missing values are explicitly encoded (e.g., "Smoking status is unknown") rather than omitted, so the text encoder can distinguish "denied" from "unknown."
- All 2,298 rows processed (original proposal scoped Week 1 at 100 samples).

**Implementation:** `scripts/preprocessing/generate_text.py`

### 4.2 Text Encoder Selection — 10-Model Benchmark

A comprehensive benchmark compared 10 text embedding models on PAD-UFES-20 clinical notes to select the optimal encoder for the fusion pipeline.

**Models evaluated:**

| Model | Dim | Domain | Contrastive | Inference (s) |
|-------|-----|--------|-------------|---------------|
| ClinicalBERT | 768 | Medical | No | 44.8 |
| Bio-ClinicalBERT | 768 | Medical | No | 76.8 |
| BiomedBERT | 768 | Medical | No | 72.4 |
| BioSimCSE | 768 | Medical | Yes | 67.5 |
| MedEmbed Base | 768 | Medical | Yes | 78.8 |
| ClinicalBERT | 768 | Medical | No | 44.8 |
| GTE Base | 768 | General | Yes | 343.2 |
| BGE Base | 768 | General | Yes | 77.8 |
| Qwen3 Embedding 0.6B | 1024 | General | Yes | 2,523.9 |
| Jina v5 Text Small | 1024 | General | Yes | 2,659.1 |

**Selection: ClinicalBERT** (`medicalai/ClinicalBERT`)

**Rationale:**
- Fastest 768-dim model at 44.8s inference, 0.7410 macro F1, 0.9557 ROC-AUC on PAD-UFES-20 6-class classification
- 768-dimensional output matches the fusion module's `TEXT_EMBED_DIM` with no projection needed
- Contrastive-trained on GTE-base with 2M+ medical text pairs from PubMed, MIMIC-IV, ClinicalTrials.gov, and medical QA datasets
- Fast inference (~76s for 2,298 samples) vs 1024-dim alternatives (Qwen3: 42 min, Jina: 44 min) with no meaningful performance tradeoff

**Selection rule applied:** Prefer the fastest 768-dim model unless a 1024-dim model shows strictly superior downstream classification performance. ClinicalBERT met this bar — Qwen3 and Jina were 33× slower with higher dimensionality that would require an extra projection layer.

**Embedding handoff:** All 10 models' embeddings (`.npy` files, 2,298 × D) packaged with `embedding_index.csv` for row alignment, similarity analysis, and reproducible benchmarking.

### 4.3 Cross-Attention Explainability (XAI)

The original proposal specified text-based explanation generation ("grandma-friendly" output). The implemented approach is more rigorous: **cross-attention weight visualization** from the fusion layer.

**How it works:**
- In the fusion module, text embeddings (Query) attend over MedSigLIP image patch tokens (Key/Value) via `nn.MultiheadAttention`
- The attention weights (shape: B × 1 × 1024) represent how much each of the 1,024 image patches (32×32 grid) was attended to by the clinical text
- These weights are reshaped to 32×32 and overlaid on the original image as a heatmap

**Why this is better than generated text:**
- Grounded in the model's actual decision process, not a post-hoc summary
- Spatially interpretable — clinicians can see which lesion regions the model focused on
- Reproducible and faithful to the model — no risk of generating explanations that don't match the prediction
- Derived from the cross-attention fusion layer specifically, not Grad-CAM or ViT attention rollout

**Implementation:** `src/fusion/models/fusion.py` → `get_attention_weights()`, visualized in the Streamlit demo Results page.

---

## 5. Integration with CV/ML

### Architecture (Locked)

```
Image → MedSigLIP (448×448) → patch tokens [B, 1024, 1152]
                                                    ↓ (Key, Value)
Metadata → Textification → ClinicalBERT → text embedding [B, 768]
                                                    ↓ (Query)
                                            Cross-Attention (d_k=256)
                                                    ↓
                                            Pooled attention output [B, 256]
                                                    ↓
ABCD features [B, 128] → projection [B, 256] → Late-fusion concat [B, 512]
                                                    ↓
                                            MLP 512 → 256 → 6 (logits)
```

### NLP Contract
- **NLP consumes:** PAD-UFES-20 Mendeley `metadata.csv` (26 tabular features per sample)
- **NLP produces:**
  - `generated_note` (string) — clinical narrative per sample
  - `text_embedding` (768-d float32 tensor) — ClinicalBERT sentence embedding
- **Fusion consumes:** text embedding as Query in cross-attention with image patch tokens as Key/Value
- **XAI produces:** attention weights [B, 1, 1024] from `fusion.get_attention_weights()`

### Key Constants (`src/common/constants.py`)
- `TEXT_EMBED_DIM = 768`
- `MAX_TOKEN_LENGTH = 512`
- `CROSS_ATTN_DK = 256`
- `CROSS_ATTN_HEADS = 8`

> **Note:** `constants.py` currently references `CLINICALBERT_MODEL = "emilyalsentzer/Bio_ClinicalBERT"` — Updated: renamed to TEXT_ENCODER_MODEL, set to medicalai/ClinicalBERT per #82 benchmark.

---

## 6. Timeline (Actual)

| Week | Date | Milestone | Status |
|------|------|-----------|--------|
| 1 | Feb 9 | NLP proposal drafted | Done |
| 2 | Feb 16 | Template-based textification for all 2,298 rows | Done |
| 3 | Feb 23 | 10-model embedding pipeline built | Done |
| 4 | Mar 2 | All 10 models run, embeddings generated | Done |
| 5 | Mar 9 | Embedding handoff packaged for ML team | Done |
| 6 | Mar 16 | ClinicalBERT selected as text encoder per #82 benchmark | Done |
| 7 | Mar 19 | Text benchmark execution on PAD-UFES-20 labels (#71, Nitesh) | In progress |
| 8 | Mar 26 | Benchmark results documented, ClinicalBERT locked in constants.py | Planned |
| 9 | Apr 2 | Real model training with text stream integrated | Planned |
| 10 | Apr 9 | NLP course report — methodology + results sections | Planned |
| 11 | Apr 16 | NLP course report — final draft | Planned |
| 12 | Apr 23 | Final submission | Planned |

---

## 7. References

- Khodadad, M., Shiraee Kasmaee, A., Astaraki, M., & Mahyar, H. (2025). Towards Domain Specification of Embedding Models in Medicine. arXiv:2507.19407v2.
- PAD-UFES-20: Pacheco et al. (2020). PAD-UFES-20: A skin lesion dataset. Mendeley Data, V1.
- MedSigLIP: google/medsiglip-448 (Hugging Face).
- ClinicalBERT: medicalai/ClinicalBERT (Hugging Face).

---

## 8. Revision History

| Date | Author | Change |
|------|--------|--------|
| 2026-02-09 | Akash | Initial draft |
| 2026-03-19 | Akash | Updated to reflect actual implementation: ClinicalBERT selection, 10-model benchmark, cross-attention XAI replacing text explanation generation, removed LLM-enhanced notes and RAG stretch goal |