# CV Proposal — AI Dermatology (Skin Lesion Classification + Fairness Slice)

**Project:** Multimodal Skin Cancer Detection (CV + ML + NLP)
**Course(s):** Computer Vision (CV) + Machine Learning (ML) + NLP (shared project)
**Team Lead:** Akash
**CV Team:** Dre (Joseph Defendre), Sourav Das, Akash (and others as assigned)
**Repo:** https://github.com/multimodal-derm/multimodal-skin-cancer-detection
**Date:** 2026-02-09

> Revision note (2026-03-14): this proposal has been updated to reflect the
> current repository implementation, which uses MedSigLIP rather than the
> original EfficientNet-B4 baseline.

---

## 1. Problem Statement

Skin lesion assessment is commonly performed by visual inspection of lesion imagery, often supported by clinical context. Our project focuses on the **Computer Vision (CV)** portion of a 3-stage multimodal pipeline: given a clinical photo of a lesion, predict a limited set of clinically meaningful categories, returning **class probabilities** and **embeddings** that feed into NLP and fusion stages downstream.

A core motivation is **robust performance across diverse skin tones**. Existing systems demonstrate differing error rates across skin tones due to dataset imbalance. Our CV plan explicitly includes a fairness analysis slice using the **Fitzpatrick skin type** metadata provided by PAD-UFES-20.

---

## 2. Scope (MVP) and Deliverables

### 2.1 MVP Classification Scope (CV)
We classify into **6 categories** matching the PAD-UFES-20 label taxonomy:

- ACK — Actinic Keratosis
- BCC — Basal Cell Carcinoma
- MEL — Melanoma
- NEV — Melanocytic Nevus
- SCC — Squamous Cell Carcinoma
- SEK — Seborrheic Keratosis

### 2.2 CV Deliverables

1. **Reproducible dataset pipeline** — download, preprocess (448x448, MedSigLIP normalization), train/val split
2. **Baseline vision encoder** — MedSigLIP fine-tuning
3. **Evaluation report** — macro-F1, accuracy, per-class precision/recall, confusion matrix, AUC, pAUC(>=0.80 TPR)
4. **Fairness slice** — subgroup metrics by Fitzpatrick skin type
5. **Model output contract** — predicted class + probabilities + 1024-d embedding for fusion/NLP

---

## 3. Dataset Plan

### 3.1 Primary Dataset: PAD-UFES-20 (Official Sources Only)

We use **PAD-UFES-20**, a multimodal dataset with paired clinical images and structured metadata (age, sex, Fitzpatrick skin type, lesion location, symptoms).

**Official sources:**
- ISIC Archive Collection 406: https://api.isic-archive.com/collections/406/
- Mendeley DOI: https://data.mendeley.com/datasets/zr7vgbcyr2/1

> We do NOT use Kaggle. Any Kaggle reference in proposals will be rejected by the professor.

**Why PAD-UFES-20:**
- Paired images + clinical metadata (supports CV + NLP + Fusion)
- Fitzpatrick skin type labels (supports fairness analysis)
- 6 clear diagnostic categories with sufficient samples
- Official ISIC-hosted collection

### 3.2 Optional Pretraining
ISIC 2018 Challenge Task 3 may be used for optional CV pretraining only. It is NOT the primary dataset.

### 3.3 Data Storage
- Raw and processed data are **gitignored**
- Standardized paths via `config/dataset.yaml`
- One person creates a cleaned/resized pack for team distribution via Google Drive

---

## 4. Methodology (CV Pipeline)

### 4.1 Preprocessing
- Resize to **448x448**
- Apply MedSigLIP-compatible image normalization (mean/std = 0.5)
- Data augmentation (train only): random flips, rotation, color jitter

### 4.2 Model
**Baseline:** MedSigLIP (`google/medsiglip-448`)
- Replace classifier head for 6-class output
- Fine-tune end-to-end
- Extract 1024 MedSigLIP patch tokens (1152-d each) for fusion

### 4.3 Training
- **Cross-Entropy Loss** (class-weighted if imbalance warrants it)
- 80/20 stratified split, batch size 32
- AdamW optimizer, lr=0.001, cosine schedule
- Early stopping (patience=5)

### 4.4 Metrics
- **Macro-F1** (primary, robust to imbalance)
- **Accuracy**
- Per-class precision / recall
- Confusion matrix
- AUC (one-vs-rest)
- **pAUC (TPR >= 0.80)** — clinically relevant partial AUC

---

## 5. Fairness Slice (Skin Tone Robustness)

### 5.1 Goal
Quantify whether model error rates differ across Fitzpatrick skin types.

### 5.2 Approach
PAD-UFES-20 provides **Fitzpatrick skin type** per sample:
- Compute subgroup metrics: macro-F1, accuracy, per-class recall by Fitzpatrick group
- Report worst-group performance gap from overall
- Visualize performance breakdown

---

## 6. Outputs for ML/NLP Integration

CV publishes a stable output contract (see `docs/specs/model_io.md`):

| Field                 | Type                    | Description                        |
|-----------------------|-------------------------|------------------------------------|
| `predicted_class`     | `str`                   | Top-1 predicted label              |
| `class_probabilities` | `dict[str, float]`      | Softmax probabilities (6 classes)  |
| `embedding_vector`    | `list[float]` (1024-d)  | For fusion model + similarity RAG  |

---

## 7. Risks and Mitigations

| Risk | Mitigation |
|------|-----------|
| PAD-UFES-20 is smaller (~2,298 samples) | Start with full dataset; optional ISIC pretraining if underfitting |
| Class imbalance | Class-weighted loss, stratified splits, report per-class metrics |
| Fairness gaps across Fitzpatrick types | Report transparently; augmentation strategies |
| Compute constraints | MedSigLIP is gated on Hugging Face and heavier than the original baseline; keep an offline smoke-test fallback for local validation |

---

## 8. Timeline

**Week 1 (now):**
- Download + preprocess PAD-UFES-20 (448x448, MedSigLIP normalization)
- MedSigLIP forward pass working
- DataLoaders + 80/20 split

**Week 2:**
- Baseline training loop + evaluation metrics
- First confusion matrix + AUC results

**Weeks 3-4:**
- Tune augmentations / loss weighting
- Begin fairness slice analysis by Fitzpatrick type
- Produce embeddings for fusion team

**Weeks 5-8:**
- Finalize results and fairness reporting
- Support fusion integration
- Final documentation

---

## 9. Success Criteria

1. Reproducible baseline classifier on PAD-UFES-20
2. Strong macro-F1 + per-class metrics
3. Stable embeddings + probabilities flowing to fusion/NLP
4. Fairness slice with Fitzpatrick subgroup analysis

---

## 10. References

- PAD-UFES-20: Pacheco et al. (2020). PAD-UFES-20: A skin lesion dataset. https://data.mendeley.com/datasets/zr7vgbcyr2/1
- ISIC Archive: https://api.isic-archive.com/collections/406/
- MedSigLIP: Google Health AI Developer Foundations. https://huggingface.co/google/medsiglip-448
- Fairness: subgroup metrics and worst-group performance reporting
