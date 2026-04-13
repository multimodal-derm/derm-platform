# Vision (CV) Module

## Overview

The CV module handles skin lesion image analysis using a MedSigLIP backbone
loaded from `google/medsiglip-448`, plus a standalone ResNet-18 baseline for
single-stream PAD-UFES-20 benchmarking.

## VisionEncoder

- **Input**: Preprocessed RGB image tensor `(B, 3, 448, 448)`
- **Output**:
    - `patch_tokens`: `(B, 1024, 1152)` — default MedSigLIP patch sequence for fusion
    - `pooled` (optional): `(B, 1152)` — mean-pooled image embedding for classifier-style heads
    - `spatial` (optional): `(B, 1152, 32, 32)` — patch-aligned feature map for Grad-CAM
- **Default behavior**:
    - returns patch tokens for fusion
    - set `return_pooled=True` for a single pooled image embedding
    - set `return_spatial=True` to receive pooled + spatial features

## Preprocessing Pipeline

1. Resize images to 448×448
2. Rescale pixels to `[0, 1]` and normalize with mean/std `[0.5, 0.5, 0.5]`
3. Feed the batch into `MedSiglipVisionEncoder`

## Dataset

`PADUFES20Dataset` — PyTorch Dataset class for PAD-UFES-20 images with
stratified train/val DataLoaders.

`PADUFES20BaselineDataset` — standalone dataset wrapper for the from-scratch
ResNet-18 baseline using 224×224 RGB tensors and standard normalization.

## ResNet-18 Baseline

- **Model:** `src.cv.models.resnet18.ResNet18`
- **Input:** `(B, 3, 224, 224)`
- **Output:** `(B, 6)` logits over `ACK`, `BCC`, `MEL`, `NEV`, `SCC`, `SEK`
- **Training entrypoint:** `python -m src.cv.train_resnet_baseline`
- **Artifacts:** `best.pt`, `history.csv`, `metrics.json`

The baseline is implemented from scratch and does not use
`torchvision.models`.

## Checkpoint Access

`google/medsiglip-448` is gated on Hugging Face. The module smoke test tries
the real checkpoint first and falls back to a lightweight compatible backbone
when access is unavailable. Set `MEDSIGLIP_LOAD_PRETRAINED=1` to require the
real checkpoint and fail fast if authentication is missing.

*Full API documentation coming soon.*
