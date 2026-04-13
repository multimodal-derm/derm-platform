# ResNet-18 Baseline

Issue [#72](https://github.com/multimodal-derm/multimodal-skin-cancer-detection/issues/72)
requires a standalone ResNet-18 baseline implemented from scratch, with its
own training loop and logged PAD-UFES-20 accuracy metrics.

## Logged Run

Run date: **March 21, 2026**

Command used:

```bash
python -m src.cv.train_resnet_baseline \
  --train-csv data/processed/train.csv \
  --val-csv data/processed/val.csv \
  --images-dir data/raw \
  --output-dir /tmp/resnet18_baseline_unweighted \
  --epochs 1 \
  --batch-size 32 \
  --num-workers 0 \
  --device mps
```

## Dataset Split

- Train samples: `1838`
- Validation samples: `460`
- Classes: `ACK`, `BCC`, `MEL`, `NEV`, `SCC`, `SEK`

## Validation Metrics

| Metric | Value |
|--------|-------|
| Accuracy | `0.4152` |
| Loss | `1.4194` |
| Macro AUC-ROC | `0.6777` |
| Macro pAUC | `0.4333` |
| Macro Precision | `0.1366` |
| Macro Recall | `0.1982` |
| Macro Specificity | `0.8500` |
| Macro F1 | `0.1596` |
| Macro MCC | `0.0480` |

## Notes

- The baseline run uses the new standalone `src.cv.models.resnet18.ResNet18`
  implementation and does **not** depend on `torchvision.models`.
- The default baseline objective is plain cross-entropy so the logged number
  stays comparable to overall top-1 system accuracy.
- Training artifacts are written by default to `outputs/resnet18_baseline/`
  during normal runs; the `/tmp` path above was used only for this logged
  local benchmark run.
