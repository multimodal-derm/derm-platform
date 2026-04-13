# Fairness Audit

## Overview

The fairness module evaluates whether the multimodal skin cancer detection
system performs equitably across patient demographics, with a primary focus
on Fitzpatrick skin type. This is critical because dermatological AI systems
have historically shown performance degradation on darker skin tones.

**Module:** `src/common/fairness.py` (24 tests passing)
**Owner:** Akash

## Fitzpatrick Skin Type

We use the Fitzpatrick skin type metadata provided by PAD-UFES-20 to evaluate
model fairness across skin tone groups. This keeps the fairness slice aligned
with the labels available in the project dataset instead of inferring skin tone
from image pixels alone.

## Methodology

- Use the dataset-provided Fitzpatrick label for each sample
- Compute metrics such as macro-F1, accuracy, and per-class recall separately
  for each Fitzpatrick group
- Compare each subgroup against overall performance and report the worst-group gap
- Evaluate demographic parity and equalized odds across subgroups
- If material disparities are found, document them and evaluate mitigation options
- Fairness metrics are also logged during real model training (#78) per Fitzpatrick type

## Skin Tone Groups

| Group              | Fitzpatrick Types | PAD-UFES-20 Coverage |
|--------------------|-------------------|----------------------|
| Very light         | I                 | Limited              |
| Light              | II                | Majority             |
| Intermediate       | III               | Moderate             |
| Tan / brown        | IV                | Limited              |
| Brown              | V                 | Very limited         |
| Dark brown / black | VI                | Very limited         |

> **Known limitation:** PAD-UFES-20 is heavily skewed toward Fitzpatrick
> types I–III (Brazilian population). Results for types IV–VI will have
> wider confidence intervals due to small sample sizes.

## Integration with Pipeline

- **Training:** Fairness metrics logged per Fitzpatrick group alongside
  standard classification metrics (per-class F1, macro F1, confusion matrix)
- **Demo:** Streamlit Fairness page (`demo/pages/fairness.py`) will display
  per-subgroup performance breakdowns once real model results are available
- **Reports:** Fairness analysis included in the ML course report

## Tools

- Custom fairness module (`src/common/fairness.py`) — 24 unit tests
- [Fairlearn](https://fairlearn.org/) for demographic parity and equalized odds
- Pandas / scikit-learn for grouped metric reporting

## Metrics Computed

- Per-group macro-F1 and accuracy
- Per-group per-class recall (e.g., MEL recall for Fitzpatrick I vs III)
- Worst-group performance gap (max disparity across groups)
- Demographic parity difference
- Equalized odds difference

## Latest Post Hoc Audit Results

The saved multimodal checkpoint (`outputs/multimodal/best.pt`) was evaluated
post hoc for per-Fitzpatrick fairness in issue #92.

| Fitzpatrick Type | Support | F1 | FNR | FPR |
|------------------|---------|----|-----|-----|
| Fitzpatrick I | 33 | 0.9655 | 0.0000 | 0.4000 |
| Fitzpatrick II | 180 | 0.9309 | 0.0303 | 0.3125 |
| Fitzpatrick III | 76 | 0.9381 | 0.0364 | 0.2381 |
| Fitzpatrick IV | 10 | 0.5714 | 0.0000 | 0.3750 |
| Fitzpatrick V | 1 | 0.0000 | 0.0000 | 0.0000 |
| Fitzpatrick VI | 0 | N/A | N/A | N/A |

- FNR disparity: `0.0364`
- FPR disparity: `0.4000`

> **Important caveats:** Type 5 has support `1`, so those metrics are not
> statistically meaningful. These results were generated from a locally
> reproduced validation split (`459` rows, Fitzpatrick coverage `300/459`),
> which differs slightly from the original issue note (`460` rows,
> `305/460` Fitzpatrick-labeled). The evaluation path is correct, but exact
> counts depend on reproducing the original split byte-for-byte.
