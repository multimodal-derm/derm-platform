---
title: "Multimodal Skin Cancer Detection"
subtitle: "Pattern Recognition and Computer Vision"
author: |
  Sourav Das · Skandhan Madhusudhana · Akash Shridhar Shetty · Joseph Defendre
date: "Spring 2026"
geometry: "top=0.1in bottom=0.5in, left=0.5in, right=0.5in"
fontsize: 10pt
linestretch: 1.05
---

## Project Overview

We propose a multimodal deep learning system for automated skin lesion classification.
Given a clinical photograph of a skin lesion alongside patient metadata, the system predicts one of six diagnostic categories: **Melanoma (MEL)**, **Basal Cell Carcinoma (BCC)**, **Squamous Cell Carcinoma (SCC)**, **Actinic Keratosis (ACK)**, **Seborrheic Keratosis (SEK)**, and **Melanocytic Nevus (NEV)**.
Skin cancer is among the most prevalent cancers globally, and early accurate diagnosis significantly improves patient outcomes.
Our system goes beyond standard image-only classifiers by fusing three complementary information streams which are dermoscopic images, structured clinical metadata, and handcrafted dermatological features which are fused into a unified end-to-end architecture.

## Data

Our primary dataset is PAD-UFES-20 (Pacheco et al., 2020), a publicly available collection of 2,298 smartphone-captured skin lesion images paired with 26 structured clinical metadata fields per patient, including age, sex, anatomical region, Fitzpatrick skin type, lesion diameter, symptoms, and risk factors.
The dataset is freely accessible via Mendeley Data (DOI: 10.17632/zr7vgbcyr2.1) and requires no special access approval.
We apply an 80/20 stratified train-validation split to preserve class proportions across all six categories. 
Since the dataset exhibits significant class imbalance, with benign nevi being considerably overrepresented, we employ Focal Loss during training to reduce bias toward majority classes.

## Model

Our architecture comprises three parallel encoding streams fused through a cross-attention mechanism:

- **Vision Stream:** A frozen **MedSigLIP-448** encoder (Google, 2024) processes 448×448 lesion images and extracts 1,024 spatial patch tokens (1,152-dim each), capturing fine-grained visual patterns specific to medical imagery.

- **Text Stream:** Structured patient metadata is converted into natural-language clinical narratives via a template-based textification module, then encoded by **ClinicalBERT** into a 768-dimensional sentence embedding.

- **ABCD Feature Stream:** Classical dermatological features like Asymmetry, Border irregularity, Color variation, and Diameter, are computed from lesion segmentation masks, yielding a 14-dimensional handcrafted feature vector.

**Fusion:** The ClinicalBERT embedding serves as the query attending over MedSigLIP patch tokens via multi-head cross-attention (8 heads, d=256).
The pooled result is concatenated with a projected ABCD vector (both 256-dim), producing a 512-dimensional joint representation fed into a two-layer MLP classifier.
We additionally incorporate attention heatmap visualizations for explainability and a fairness audit stratified by Fitzpatrick skin tone to assess equitable performance across patient subgroups.

## Compute

All training is performed on **Google Colab Pro**, providing access to NVIDIA A100/V100 GPUs with high-RAM runtimes.
The MedSigLIP backbone (~3.5 GB) is loaded from Hugging Face and kept **frozen** during training to minimize compute demand; only the fusion module and classifier head are trained end-to-end.
We use **PyTorch 2.0+** with AdamW optimization (lr = 1e-4, cosine annealing schedule) and early stopping (patience = 5) over up to 30 epochs at batch size 16.
Google Colab Pro's persistent runtimes and Google Drive integration allow seamless dataset storage and checkpoint management across training sessions.