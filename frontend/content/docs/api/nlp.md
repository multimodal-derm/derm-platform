# NLP Module

## Overview

The NLP module converts structured PAD-UFES-20 patient metadata into clinical text narratives and encodes them using ClinicalBERT for cross-attention fusion with the vision stream.

## Pipeline

1. **Template-based note generation** — converts all 26 metadata columns (age, sex, symptoms, risk factors, family background, environmental factors) into structured English clinical narratives for all 2,298 samples
2. **Text encoding** — encodes clinical notes using ClinicalBERT (`medicalai/ClinicalBERT`) to produce a 768-dimensional embedding
3. **Cross-attention fusion** — text embedding serves as Query attending over MedSigLIP image patch tokens (Key/Value), producing text-guided visual features

## Text Encoder

**Selected model:** ClinicalBERT (768-dim, MLM-pretrained on clinical notes)

Selected from a 10-model benchmark comparing medical and general-purpose encoders on PAD-UFES-20 clinical notes. ClinicalBERT was chosen as the fastest 768-dim model (44.8s inference) with 0.7410 macro F1 and 0.9557 ROC-AUC on PAD-UFES-20 6-class classification. No model statistically significantly outperformed it (Wilcoxon p>0.05).

> **Methodological note:** The benchmark evaluates each encoder's best-performing classifier probe (ClinicalBERT → Random Forest, MedTE → Logistic Regression), meaning results reflect the embedding+classifier combination rather than pure embedding quality in isolation. ClinicalBERT's selection is robust — it outperformed MedTE across all five classifier types evaluated, not only with its best probe.

See `docs/proposals/nlp_proposal.md` for the full benchmark table and selection rationale.

## Example

**Input metadata:**

| age | sex | region | fitzpatrick | itch | grew | bleed | elevation | smoke |
| --- | --- | ------ | ----------- | ---- | ---- | ----- | --------- | ----- |
| 67  | M   | nose   | 2           | no   | yes  | yes   | yes       | yes   |

**Generated note:**

> Male patient, age 67, presenting with a skin lesion on the nose. Fitzpatrick skin type 2. The lesion is elevated. Itching is denied. Bleeding is reported. The lesion has increased in size over time. The patient reports smoking history.

## Output

- `generated_note`: clinical narrative string per sample
- `text_embedding`: 768-d float32 vector from ClinicalBERT sentence embedding
- Cross-attention weights (`B × 1 × 1024`) available via `fusion.get_attention_weights()` for XAI

## Key Constants
```python
TEXT_EMBED_DIM = 768
MAX_TOKEN_LENGTH = 512
CROSS_ATTN_DK = 256
CROSS_ATTN_HEADS = 8
```