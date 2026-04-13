# Multimodal Skin Cancer Detection

A multimodal AI system for skin cancer detection combining **Computer Vision**, **Natural Language Processing**, and **Cross-Attention Fusion** on the PAD-UFES-20 dataset.

## Overview

This project builds a three-stream pipeline that mimics how dermatologists diagnose skin lesions by combining lesion imagery, patient history, symptoms, and handcrafted dermatological signals.

### Stream 1 — Vision
- **Module:** CV
- **Role:** Extracts spatial patch tokens from skin lesion images using MedSigLIP (`google/medsiglip-448`)

### Stream 2 — Text
- **Module:** NLP
- **Role:** Converts patient metadata into clinical narratives and encodes them with ClinicalBERT `(768-dim)`

### Stream 3 — ABCD
- **Module:** CV
- **Role:** Extracts handcrafted dermatological features: asymmetry, border, color, diameter

### Fusion
- **Module:** ML
- **Role:** Uses cross-attention, with text as **Query** and image as **Key/Value**, then combines ABCD features through late fusion into an MLP `512 → 256 → 6`

## Key Features

- **6-class classification:** ACK, BCC, MEL, NEV, SCC, SEK
- **Cross-attention XAI:** Attention weights show which image regions the clinical text attended to, not Grad-CAM or ViT attention rollout
- **Fairness auditing:** Per-Fitzpatrick skin type performance evaluation across 24 tests
- **10-model text encoder benchmark:** ClinicalBERT selected over MedTE, BiomedBERT, and 7 others
- **Streamlit demo:** Upload an image and enter metadata to get diagnosis, confidence scores, attention heatmap, and ABCD features

## Architecture

### Three-Stream Fusion Pipeline

#### Vision path
- Image `(448×448)`
- MedSigLIP
- Patch tokens `[B, 1024, 1152]`
- Used as **Key** and **Value**

#### Text path
- Metadata
- Textification
- ClinicalBERT
- Embedding `[B, 768]`
- Used as **Query**

#### Fusion path
- Cross-attention with `d_k = 256`
- Pooled output `[B, 256]`

#### ABCD path
- Handcrafted ABCD features
- Projection to `[B, 256]`

#### Classifier
- Late-fusion concat `[B, 512]`
- MLP `512 → 256 → 6 logits`