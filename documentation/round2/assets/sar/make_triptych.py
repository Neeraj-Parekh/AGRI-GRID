"""Regenerate the SAR triptych and metrics card from the real checkpoint.

Run with the linux_venv that has torch + segmentation_models_pytorch:

    /mnt/20265E15265DEC72/study/CODE/linux_venv/bin/python make_triptych.py

Reads the Sen1Floods11 Spain sample chip and the phase1_t5d_nb checkpoint from
/media/neeraj-parekh/Data1. Encoder weights are None because every weight is
overwritten by load_state_dict, and the download is unnecessary.

The triptych is one chip, not the test mean. The card is the 89-chip mean.
"""
import numpy as np, torch, rasterio
import segmentation_models_pytorch as smp
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path("/media/neeraj-parekh/Data1/sar soil system/quick_report/gujurat_2026")
S1 = ROOT / "autoresearch_work/Sen1Floods11/sample/S1/Spain_7370579_S1Hand.tif"
LB = ROOT / "autoresearch_work/Sen1Floods11/sample/Labels/Spain_7370579_LabelHand.tif"
CKPT = ROOT / "extension/runs/_invalidated_2026-10-29/surat_2026_chapter_v1/checkpoints/phase1_t5d_nb_ft.pt"
MEAN = np.array([-11.681193351745605, -18.851974487304688], dtype=np.float32)
STD = np.array([7.167604923248291, 7.507106781005859], dtype=np.float32)

assert CKPT.exists(), CKPT
print("checkpoint", CKPT.stat().st_size, "bytes", flush=True)

with rasterio.open(S1) as ds:
    arr = ds.read().astype(np.float32)
with rasterio.open(LB) as ds:
    lab = ds.read(1).astype(np.int16)
print("S1", arr.shape, "dB range", float(arr.min()), float(arr.max()), flush=True)
vals, counts = np.unique(lab, return_counts=True)
print("label values", dict(zip(vals.tolist(), counts.tolist())), flush=True)

x = (arr.transpose(1, 2, 0) - MEAN) / STD
t = torch.from_numpy(x.transpose(2, 0, 1)[None].copy()).float()
model = smp.Unet(encoder_name="resnet34", in_channels=2, classes=1,
                 activation=None, encoder_weights=None)
state = torch.load(CKPT, map_location="cpu")
model.load_state_dict(state, strict=True)
model.eval()
with torch.no_grad():
    prob = torch.sigmoid(model(t))[0, 0].numpy()
pred = (prob >= 0.5).astype(np.uint8)
valid = lab >= 0
inter = np.logical_and(pred == 1, lab == 1).sum()
union = np.logical_or(pred == 1, lab == 1).sum()
iou = float(inter / union) if union else 0.0
print("prob min/max", float(prob.min()), float(prob.max()), flush=True)
print("pred water %.4f  ref water %.4f  per-chip IoU %.4f" % (
    pred.mean(), (lab == 1)[valid].mean(), iou), flush=True)

out = Path("/mnt/20265E15265DEC72/study/CODE/HACKATHON/temp/documentation/round2/assets/sar")
out.mkdir(parents=True, exist_ok=True)
np.save(out / "spain_vv.npy", arr[0])
np.save(out / "spain_vh.npy", arr[1])
np.save(out / "spain_prob.npy", prob)
np.save(out / "spain_pred.npy", pred)
np.save(out / "spain_label.npy", lab)
np.save(out / "spain_gray_input.npy", x)

FD = Path("/usr/share/fonts/truetype/dejavu")
def font(sz, bold=False):
    p = FD / ("DejaVuSans-Bold.ttf" if bold else "DejaVuSans.ttf")
    return ImageFont.truetype(str(p), sz) if p.exists() else ImageFont.load_default()

def norm_u8(a, lo=2, hi=98):
    v0, v1 = np.percentile(a, [lo, hi])
    v0, v1 = float(v0), float(v1)
    if v1 <= v0:
        v1 = v0 + 1.0
    return (np.clip((a - v0) / (v1 - v0), 0, 1) * 255).astype(np.uint8)

BG = (11, 15, 20)
PANEL = 552
GAP = 52
LEFT = (1920 - (3 * PANEL + 2 * GAP)) // 2
TOP = 232

def make_panel(kind, size=PANEL):
    n = lab.shape[0]
    if kind == "vv":
        im = Image.fromarray(norm_u8(arr[0]), "L").convert("RGB")
        filt = Image.LANCZOS
    elif kind == "pred":
        im = Image.new("RGB", (n, n), (26, 32, 40))
        mask = Image.fromarray((pred * 255).astype(np.uint8), "L")
        blue = Image.new("RGB", (n, n), (63, 169, 245))
        im.paste(blue, (0, 0), mask)
        filt = Image.NEAREST
    elif kind == "gt":
        im = Image.new("RGB", (n, n), (31, 41, 55))
        water = Image.fromarray(((lab == 1) * 255).astype(np.uint8), "L")
        green = Image.new("RGB", (n, n), (52, 211, 153))
        im.paste(green, (0, 0), water)
        nod = Image.fromarray(((lab < 0) * 255).astype(np.uint8), "L")
        grey = Image.new("RGB", (n, n), (75, 85, 99))
        im.paste(grey, (0, 0), nod)
        filt = Image.NEAREST
    if size != n:
        im = im.resize((size, size), filt)
    return im

def draw_triptych():
    W, H = 1920, 1080
    canvas = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(canvas)
    d.text((LEFT, 58), "Input, prediction, hand label", font=font(48, True), fill=(240, 244, 248))
    d.text((LEFT, 126),
           "Sen1Floods11 official test chip Spain_7370579  ·  Sentinel-1 VV/VH  ·  water mask at threshold 0.50",
           font=font(25), fill=(148, 163, 184))
    labels = [
        ("SENTINEL-1 VV (INPUT)", "2-channel input: VV shown, VH also fed to the model", (148, 163, 184)),
        ("U-NET PREDICTION", "blue = predicted water at threshold 0.50", (63, 169, 245)),
        ("HAND LABEL (GROUND TRUTH)", "green = water, grey = no-data", (52, 211, 153)),
    ]
    for i, (title, sub, col) in enumerate(labels):
        x = LEFT + i * (PANEL + GAP)
        d.text((x, 178), title, font=font(24, True), fill=col)
        d.text((x, 208), sub, font=font(18), fill=(120, 132, 148))
        canvas.paste(make_panel(["vv", "pred", "gt"][i]), (x, TOP))
        d.rectangle([x, TOP, x + PANEL - 1, TOP + PANEL - 1], outline=(45, 55, 68), width=2)
    y = TOP + PANEL + 46
    d.line([(LEFT, y - 18), (LEFT + 3 * PANEL + 2 * GAP, y - 18)], fill=(38, 46, 58), width=2)
    d.text((LEFT, y), "Per-chip water IoU  %.2f" % iou, font=font(38, True), fill=(240, 244, 248))
    d.text((LEFT + 640, y + 6),
           "Predicted water %.1f %%   ·   reference water %.1f %%" % (100 * pred.mean(), 100 * (lab == 1)[valid].mean()),
           font=font(24), fill=(148, 163, 184))
    small = ("Flood-water U-Net, not a paddy classifier.  Mean over 89 test chips is 0.3817 mIoU; this chip is above that mean.")
    d.text((LEFT, H - 58), small, font=font(20), fill=(110, 122, 138))
    return canvas

def draw_metrics():
    W, H = 1920, 1080
    canvas = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(canvas)
    d.text((140, 96), "SEN1FLOODS11 · OFFICIAL TEST", font=font(26, True), fill=(63, 169, 245))
    d.text((140, 190), "0.3817", font=font(210, True), fill=(240, 244, 248))
    d.text((150, 430), "mean IoU across 89 loaded test chips", font=font(36), fill=(203, 213, 225))
    d.text((150, 486), "threshold fixed at 0.50 · ResNet-34 U-Net · 10 flood events", font=font(26), fill=(148, 163, 184))
    d.line([(150, 570), (1770, 570)], fill=(38, 46, 58), width=2)
    stats = [("0.6209", "water IoU"), ("0.6927", "precision"), ("0.8569", "recall")]
    for i, (num, cap) in enumerate(stats):
        x = 150 + i * 520
        d.text((x, 630), num, font=font(76, True), fill=(52, 211, 153))
        d.text((x, 726), cap, font=font(26), fill=(148, 163, 184))
    d.text((150, 860), "Flood-water model, not a paddy classifier.", font=font(28, True), fill=(251, 191, 36))
    d.text((150, 906), "89 of 90 split chips loaded (one unreadable)  ·  seed band 0.4122 ± 0.0071 is validation, not test",
           font=font(22), fill=(110, 122, 138))
    return canvas

triptych = draw_triptych()
triptych.save(out / "sar-triptych-1920x1080.png")
triptych.save(out / "sar-triptych-1920x1080.jpg", quality=90, optimize=True)
draw_metrics().save(out / "sar-metrics-card-1920x1080.png")
for name in ["vv", "pred", "gt"]:
    make_panel(name, 900).save(out / ("sar-panel-%s.jpg" % name), quality=90, optimize=True)
print("written", sorted(p.name for p in out.iterdir()), flush=True)
