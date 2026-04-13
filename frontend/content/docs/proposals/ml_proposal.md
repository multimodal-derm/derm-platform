## Project title
Multimodal Skin Cancer Detection using Vision and Clinical Text Fusion

## Proposal authors information
Last name, first name, and Northeastern University (NU) email address. List names
beginning with last name and use NU email addresses only.

- Das, Sourav — das.sour@northeastern.edu
- Defendre, Joseph — defendre.j@northeastern.edu
- Bhatt, Nithish — bhat.nithi@northeastern.edu

## Objective
Build a multimodal model that improves skin cancer detection by combining lesion
images with patient metadata in a single classifier.
Images will be segregated into 6 diagnostic classes from PAD-UFES-20: ACK, BCC,
MEL, NEV, SCC, and SEK.

What problem is being addressed:
- Image-only models miss clinical context.
- Metadata-only models miss visual cues.
- Fusion is intended to improve accuracy and calibration for diagnosis.

## Current state-of-art
Based on public scientific publications only.

Brief summary of related work:
- CNN-based dermoscopic classifiers achieve strong performance.
- Multimodal clinical prediction work shows image + text/metadata fusion can
  improve accuracy and calibration.
- Transformer models such as BERT/ClinicalBERT provide strong clinical text
  representations for fusion.

## Approach
Initial rough idea with step-by-step ML equations and concepts:

1. Data preparation
   - Normalize images: `x' = (x - mu) / sigma` (per-channel mean/std
     scaling so pixels are on a similar scale).
   - Standardize metadata and template into short clinical notes.
   - Split data: stratified train/val/test (70/15/15) by class; group by
     patient/lesion when available to avoid leakage; fixed random seed.
   - What happens: we clean the inputs, put them on the same
     scale, write short notes from metadata, and split data into
     training/validation/testing without mixing patients.

2. Image encoding (MedSigLIP)
   - Extract visual embeddings: `h_img = f_img(x_img)` (map image to
     feature vector).
   - What happens: the model turns each image into a compact
     sequence of 1024 patch tokens with 1152-d features, plus an optional
     pooled summary for simpler baselines.

3. Text encoding (ClinicalBERT)
   - Encode text embeddings: `h_txt = f_txt(x_txt)` (map text to feature
     vector).
   - Self-attention: `Attention(Q,K,V) = softmax(Q K^T / sqrt(d_k)) V`
     (weight words by relevance).
   - What happens: the text model reads the note and focuses on
     the most important words to create a numeric summary.

4. Late fusion
   - Concatenate embeddings: `h_fuse = [h_img; h_txt]` (combine image +
     text features).
   - Optional gated fusion:
     - `g = sigmoid(W_g [h_img; h_txt])` (learn a mixing gate in [0,1]).
     - `h_fuse = g * h_img + (1 - g) * h_txt` (blend modalities
       element-wise).
   - What happens: we combine image and text summaries, and
     optionally let the model decide how much to trust each one.

5. Classifier
   - Logits: `z = W h_fuse + b` (raw class scores).
   - Probabilities: `y_hat = softmax(z)` (multi-class) or `y_hat =
     sigmoid(z)` (binary) (convert scores to probabilities).
   - What happens: the combined features are turned into class
     scores and final probabilities.

6. Loss
   - Cross-entropy: `L = - sum_c y_c log(p_c)` (penalize wrong probabilities).
   - Optional focal loss for imbalance:
     - `L = - alpha (1 - p)^gamma log(p)` (focus on hard/rare cases).
   - What happens: we measure how wrong the predictions are so
     the model can improve.

7. Optimization
   - AdamW update: `theta <- theta - lr * m_hat / (sqrt(v_hat) + eps)`
     (parameter update rule).
   - What happens: the model adjusts its internal settings to
     reduce the loss.

8. Evaluation
   - Macro-F1: `F1 = 2 * (precision * recall) / (precision + recall)`
     (balanced precision/recall).
   - ROC-AUC for overall discrimination (ranking quality across thresholds).
   - What happens: we score how well the model performs on
     unseen data.

## Dataset(s) to be used
Must be publicly-available and unrestricted.

- Primary dataset: PAD-UFES-20 ([Mendeley Data](https://data.mendeley.com/datasets/zr7vgbcyr2/1)) —
  2,298 smartphone clinical images with patient metadata across 6
  diagnoses (3 cancers, 3 benign).
- Optional external validation: ISIC Archive ([ISIC](https://www.isic-archive.com/)) —
  large public dermoscopic image repository; use a labeled subset for
  validation.

## Progress timeline
- Week 1: dataset acquisition, documentation review, and split design.
- Week 2: image preprocessing pipeline and baseline image-only model.
- Week 3: metadata templating to text and baseline text-only model.
- Week 4: ClinicalBERT encoder integration and embedding validation.
- Week 5: fusion model implementation and initial training runs.
- Week 6: hyperparameter tuning, ablations, and imbalance handling.
- Week 7: final evaluation, error analysis, and robustness checks.
- Week 8: paper drafting, code cleanup, and presentation preparation.

## Deliverables
Statement describing what will be delivered at conclusion of project (by final
project due-date).

Mandatory items:
- Project paper
- Project code (source code)
- Final presentation and its slides

Additional deliverables:
- Trained model checkpoints
- Reproducible experiment scripts
- Evaluation report with metrics and error analysis
