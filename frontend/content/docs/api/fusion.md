# Fusion Module

## Overview

The Fusion module combines CV features and NLP/metadata features to produce the
final diagnosis. Attention-based fusion consumes MedSigLIP patch tokens, while
simple late-fusion baselines can use a pooled image embedding.

## LateFusionModel

- **Inputs**:
    - `cv_tokens`: `(B, 1024, 1152)` — default MedSigLIP patch tokens from VisionEncoder for attention-based fusion
    - `cv_pool` (optional): `(B, 1152)` — pooled image embedding from `VisionEncoder(..., return_pooled=True)` for simple baselines
    - `meta_features`: `(B, N)` — from NLP or tabular metadata
- **Output**:
    - `logits`: `(B, 6)` — class predictions

## Architecture
```
cv_pool (1152-d)
    |
    v
[Linear → ReLU → Dropout] ──┐
                              ├──► concat ──► [Linear → ReLU → Dropout → Linear] ──► logits
meta_features (N-d)    ──────┘
    |
    v
[Linear → ReLU → Dropout]
```

## Metrics

- AUC-ROC
- pAUC (TPR ≥ 0.80)
- F1, Precision, Recall
- Sensitivity, Specificity

*Full API documentation coming soon.*
