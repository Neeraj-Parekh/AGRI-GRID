# SAR triptych and metrics card

Made on 8 Nov 2026 by running the real checkpoint, not by redrawing a figure. The script that
produced these files is `make_triptych.py` in this folder.

## Provenance

| Item | Value |
|---|---|
| Checkpoint | `/media/neeraj-parekh/Data1/sar soil system/quick_report/gujurat_2026/extension/runs/_invalidated_2026-10-29/surat_2026_chapter_v1/checkpoints/phase1_t5d_nb_ft.pt` |
| sha256 | `83c24334657a794854808b7f804b5b31f8a060269716a841734dce9389d32a1f` (matches `RUN_INFO.json`) |
| Architecture | ResNet-34 U-Net, 2 input channels `[VV_dB, VH_dB]`, 1 output, sigmoid at threshold 0.50 |
| Normalisation | mean `[-11.681193351745605, -18.851974487304688]`, std `[7.167604923248291, 7.507106781005859]` |
| Input chip | `autoresearch_work/Sen1Floods11/sample/S1/Spain_7370579_S1Hand.tif`, 512 × 512 × 2 |
| Hand label | `autoresearch_work/Sen1Floods11/sample/Labels/Spain_7370579_LabelHand.tif`, 512 × 512, values −1 / 0 / 1 |
| Split | Sen1Floods11 official test chip; 89 of the 90 split chips load in the evaluator |

The folder name `_invalidated_2026-10-29` refers to the run directory, not the weights. The
weights hash is exactly the one recorded in `extension/runs/surat_2026_chapter_v1/RUN_INFO.json`
for the run that produced the published number, so this is the 0.3817 model.

## What the images show

| File | Content |
|---|---|
| `sar-triptych-1920x1080.png` / `.jpg` | three panels: Sentinel-1 VV input, U-Net prediction, hand label |
| `sar-panel-vv.jpg`, `sar-panel-pred.jpg`, `sar-panel-gt.jpg` | the same three panels at 900 × 900 for cutting in separately |
| `sar-metrics-card-1920x1080.png` | **0.3817** mean IoU over 89 test chips, with water IoU 0.6209, precision 0.6927, recall 0.8569 |
| `spain_vv.npy`, `spain_vh.npy` | the two input channels in dB |
| `spain_prob.npy` | sigmoid probability, 0–1 |
| `spain_pred.npy` | binary prediction at 0.50 |
| `spain_label.npy` | hand label (−1 no-data, 0 land, 1 water) |

Measured on this chip: predicted water 32.2 %, reference water 26.7 %, **per-chip IoU 0.6136**.
That is one chip and it is above the test mean; the card is the mean, the triptych is the chip.
Do not present 0.61 as the model's overall score.

## What not to claim

- The model is a **flood-water** U-Net trained on Sen1Floods11. It is not a paddy classifier.
- 0.3817 is the mean over the 89 chips that load, threshold fixed at 0.50, 10 flood events.
- 0.4122 ± 0.0071 is a **validation** seed band, not a test result.
- The Surat p014 figures in the project's `data_request/` are rule-based OPT / CD-A / CD-B
  change detectors, not this U-Net, and Surat has only 400 point labels, no dense ground truth.
  Do not use them as the "prediction vs ground truth" pair.
- The terrain paper's 0.524 mean IoU belongs to a different model and dataset. Do not mix it in.

The Spain chip is used because it is the one Sen1Floods11 sample with both a real input and a
real hand label on this machine. The triptych says "Spain" in the subtitle, so the geography is
not disguised.

## Regenerate

```bash
cd documentation/round2/assets/sar
/mnt/20265E15265DEC72/study/CODE/linux_venv/bin/python make_triptych.py
```

The script reads roughly 100 MB of checkpoint from the external Data1 disk and runs one forward
pass on CPU; it takes a few seconds after the imports.
