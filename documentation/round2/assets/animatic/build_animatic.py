#!/usr/bin/env python3
"""Build the 7:35 scratch animatic for the AGRI-GRID Round 2 video.

Every shot is placed at the script time, labelled with its source, and carries the
voice-over line as a lower third so the narrator can record against picture. Missing
face-cam takes are explicit placeholder cards, not stand-ins.

Run:

    /mnt/20265E15265DEC72/study/CODE/linux_venv/bin/python build_animatic.py

Outputs land in /tmp/opencode/animatic/build and are copied to this folder.
Silent, 1920x1080, 24 fps, H.264.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageOps
import subprocess
import textwrap
import shutil
import math

ROOT = Path("/mnt/20265E15265DEC72/study/CODE/HACKATHON/temp")
A = ROOT / "documentation/round2/assets"
HERE = A / "animatic"
BUILD = Path("/tmp/opencode/animatic")
SEGDIR = BUILD / "segments"
CARD = BUILD / "cards"
OVDIR = BUILD / "overlays"
COMP = BUILD / "composed"
for d in (SEGDIR, CARD, OVDIR, COMP, HERE):
    d.mkdir(parents=True, exist_ok=True)

W, H, FPS = 1920, 1080, 24
TOTAL = 455.0

INK = (11, 15, 20)
INK2 = (20, 26, 33)
WHITE = (240, 244, 248)
GREY = (148, 163, 184)
DIM = (110, 122, 138)
GREEN = (52, 211, 153)
BLUE = (63, 169, 245)
AMBER = (251, 191, 36)
RED = (248, 113, 113)
VIOLET = (167, 139, 250)
ORANGE = (251, 146, 60)

FONT_REG = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
FONT_BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
FONT_MR = "/usr/share/fonts/truetype/noto/NotoSansDevanagari-Regular.ttf"
FONT_MR_B = "/usr/share/fonts/truetype/noto/NotoSansDevanagari-Bold.ttf"


def F(size, bold=False, mr=False):
    if mr:
        return ImageFont.truetype(FONT_MR_B if bold else FONT_MR, size)
    return ImageFont.truetype(FONT_BOLD if bold else FONT_REG, size)


def fit(path):
    return ImageOps.fit(Image.open(path).convert("RGB"), (W, H), Image.LANCZOS)


def darken(im, alpha=140):
    ov = Image.new("RGBA", im.size, (6, 10, 14, alpha))
    return Image.alpha_composite(im.convert("RGBA"), ov).convert("RGB")


def text_w(d, s, f):
    b = d.textbbox((0, 0), s, font=f)
    return b[2] - b[0]


def center(d, box, s, f, fill):
    x0, y0, x1, y1 = box
    b = d.textbbox((0, 0), s, font=f)
    x = x0 + (x1 - x0 - (b[2] - b[0])) / 2 - b[0]
    y = y0 + (y1 - y0 - (b[3] - b[1])) / 2 - b[1]
    d.text((x, y), s, font=f, fill=fill)


def chip(d, x, y, s, f, accent, fg=WHITE, pad=18):
    tw = text_w(d, s, f)
    d.rounded_rectangle([x, y, x + tw + pad * 2, y + f.size + pad], radius=8,
                        fill=(8, 13, 18, 225), outline=accent + (120,), width=2)
    d.text((x + pad, y + pad / 2), s, font=f, fill=fg)
    return tw + pad * 2


def card_title(im, kicker, title, sub=None):
    d = ImageDraw.Draw(im)
    d.rectangle([0, 0, W, 8], fill=GREEN)
    d.text((120, 92), kicker, font=F(24, True), fill=GREEN)
    d.text((120, 140), title, font=F(64, True), fill=WHITE)
    if sub:
        d.text((120, 226), sub, font=F(28), fill=GREY)
    return im


# ---------------------------------------------------------------- cards

def title_card():
    im = fit(A / "deck-visuals/01_slide_01_title_visual.jpg")
    ov = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(ov)
    d.rectangle([0, 0, 980, H], fill=(6, 10, 14, 205))
    d.rectangle([0, 0, 980, 8], fill=GREEN)
    im = Image.alpha_composite(im.convert("RGBA"), ov).convert("RGB")
    d = ImageDraw.Draw(im)
    d.text((110, 250), "TEAM FUSIONFORGE", font=F(24, True), fill=GREEN)
    d.text((110, 300), "AGRI-GRID", font=F(150, True), fill=WHITE)
    d.text((114, 500), "Ground probes + radar AI", font=F(42), fill=WHITE)
    d.text((114, 556), "for climate-smart rice", font=F(42), fill=WHITE)
    d.text((114, 680), "MIT Academy of Engineering", font=F(26), fill=GREY)
    return im


def stats_card():
    im = darken(fit(A / "deck-visuals/02_slide_02_problem_visual.jpg"), 70)
    d = ImageDraw.Draw(im)
    d.text((80, 74), "AWD · THE FIX IS ALREADY KNOWN", font=F(26, True), fill=GREEN)
    items = [
        ("−30 %", "water saved", GREEN),
        ("−48 %", "methane cut", BLUE),
        ("51.3 Mha", "rice in India", AMBER),
    ]
    for i, (num, cap, col) in enumerate(items):
        x = 80 + i * 610
        d.rounded_rectangle([x, 140, x + 560, 330], radius=18,
                            fill=(6, 10, 14, 215), outline=col + (180,), width=3)
        d.text((x + 36, 170), num, font=F(92, True), fill=col)
        d.text((x + 38, 276), cap, font=F(26), fill=GREY)
    d.text((80, 760), "Sources: IRRI · DA&FW 2024-25", font=F(22), fill=GREY)
    return im


def diagram_card(stage):
    im = Image.new("RGB", (W, H), INK)
    card_title(im, "THE IDEA", "Three layers, one decision",
               "Ground + space → one action, one record")
    d = ImageDraw.Draw(im)
    blocks = [
        ("G", "GROUND", "probe · water at 4 depths", GREEN, (110, 360, 500, 560)),
        ("S", "SPACE", "Sentinel-1 radar", BLUE, (610, 360, 1000, 560)),
        ("A", "AI", "decision + evidence", AMBER, (1110, 360, 1500, 560)),
    ]
    for i, (letter, name, sub, col, box) in enumerate(blocks):
        on = stage >= i + 1
        x0, y0, x1, y1 = box
        if on:
            d.rounded_rectangle(box, radius=20, fill=col, outline=col, width=3)
            fg = (6, 10, 14)
        else:
            d.rounded_rectangle(box, radius=20, fill=(18, 24, 31),
                                outline=(60, 72, 86), width=3)
            fg = (90, 102, 118)
        center(d, (x0 + 20, y0 + 18, x0 + 90, y0 + 88), letter,
               F(42, True), fg if on else (80, 92, 108))
        d.text((x0 + 110, y0 + 26), name, font=F(38, True), fill=fg)
        d.text((x0 + 40, y0 + 112), sub, font=F(24), fill=fg if on else (80, 92, 108))
    if stage >= 3:
        # arrows from AI down to the two outcomes
        d.line([(1300, 560), (1300, 640), (820, 640), (820, 700)], fill=AMBER, width=5)
        d.polygon([(820, 716), (806, 690), (834, 690)], fill=AMBER)
        d.line([(1300, 560), (1300, 700)], fill=AMBER, width=5)
        d.polygon([(1300, 716), (1286, 690), (1314, 690)], fill=AMBER)
        for box, label, sub, col in [
            ((600, 720, 1040, 840), "FARMER", "one SMS, one action", GREEN),
            ((1120, 720, 1560, 840), "EVIDENCE", "timestamped record", BLUE),
        ]:
            d.rounded_rectangle(box, radius=16, fill=(18, 24, 31), outline=col, width=3)
            d.text((box[0] + 28, box[1] + 18), label, font=F(28, True), fill=col)
            d.text((box[0] + 28, box[1] + 60), sub, font=F(22), fill=GREY)
    d.text((110, 930), "Stage %d of 3" % stage, font=F(20), fill=DIM)
    return im


def honesty_card(stage):
    im = Image.new("RGB", (W, H), INK)
    card_title(im, "STATUS · 8 NOV 2026", "Where we honestly are")
    d = ImageDraw.Draw(im)
    d.rounded_rectangle([110, 300, 910, 780], radius=18, fill=(16, 22, 29),
                        outline=(45, 56, 70), width=2)
    d.rounded_rectangle([1010, 300, 1810, 780], radius=18, fill=(16, 22, 29),
                        outline=(45, 56, 70), width=2)
    d.text((150, 330), "BUILT", font=F(30, True), fill=GREEN)
    d.text((150, 380), "✓", font=F(30, True), fill=GREEN)
    built = ["Gateway prototype", "Dashboard", "Probe Explorer", "SAR model (trained)"]
    for i, s in enumerate(built):
        d.text((200, 376 + i * 62), s, font=F(30), fill=WHITE)
    d.text((1050, 330), "IN BUILD", font=F(30, True), fill=AMBER)
    d.text((1050, 380), "→", font=F(30, True), fill=AMBER)
    build = ["Probe (printing)", "Field nodes", "Soil calibration"]
    for i, s in enumerate(build):
        d.text((1100, 376 + i * 62), s, font=F(30), fill=WHITE)
    d.text((150, 700), "Probe readings simulated · thresholds illustrative", font=F(22), fill=GREY)
    if stage >= 2:
        d.rounded_rectangle([110, 820, 1810, 890], radius=14, fill=(24, 32, 20),
                            outline=AMBER, width=3)
        d.text((150, 838), "NEXT · 7-day field pilot + soil calibration", font=F(30, True), fill=AMBER)
    return im


def face_card(take, instruction):
    im = Image.new("RGB", (W, H), (14, 19, 25))
    d = ImageDraw.Draw(im)
    # dashed frame
    for x in range(80, 1840, 40):
        d.line([(x, 80), (x + 18, 80)], fill=(70, 82, 98), width=3)
        d.line([(x, 1000), (x + 18, 1000)], fill=(70, 82, 98), width=3)
    for y in range(80, 1000, 40):
        d.line([(80, y), (80, y + 18)], fill=(70, 82, 98), width=3)
        d.line([(1840, y), (1840, y + 18)], fill=(70, 82, 98), width=3)
    # simple head and shoulders
    d.ellipse([830, 250, 1090, 510], outline=(90, 102, 118), width=6)
    d.arc([740, 480, 1180, 900], 200, 340, fill=(90, 102, 118), width=6)
    d.text((720, 600), "FACE CAM", font=F(64, True), fill=RED)
    d.text((720, 690), "TAKE %d · TO RECORD" % take, font=F(40, True), fill=AMBER)
    d.text((720, 760), instruction, font=F(28), fill=GREY)
    d.text((720, 930), "placeholder · not a recorded take", font=F(22), fill=DIM)
    return im


def build_sheet_page():
    pdf = A / "prototype-circuits/AGRI_GRID_Prototype_Build_Sheet.pdf"
    out = CARD / "build-sheet-page1"
    subprocess.run(["pdftoppm", "-png", "-r", "150", "-f", "1", "-l", "1",
                    str(pdf), str(out)], check=True)
    p = sorted(CARD.glob("build-sheet-page1-*.png"))[0]
    im = Image.open(p).convert("RGB")
    bg = Image.new("RGB", (W, H), (18, 24, 31))
    im.thumbnail((820, 940))
    bg.paste(im, ((W - im.width) // 2 - 300, (H - im.height) // 2))
    d = ImageDraw.Draw(bg)
    d.text((1300, 300), "BUILD SHEET", font=F(30, True), fill=GREEN)
    d.text((1300, 350), "Prototype wiring", font=F(44, True), fill=WHITE)
    d.text((1300, 410), "and pin map", font=F(44, True), fill=WHITE)
    d.text((1300, 500), "One page per board.", font=F(24), fill=GREY)
    d.text((1300, 540), "The same sheet the", font=F(24), fill=GREY)
    d.text((1300, 580), "bench build follows.", font=F(24), fill=GREY)
    return bg


# ---------------------------------------------------------------- overlay

def overlay(label, vo, t, accent, sub=None, footnote=None, band_label=False):
    im = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    lf = F(20, True)
    if not band_label:
        # label chip, top left
        tw = text_w(d, label, lf)
        d.rounded_rectangle([44, 30, 44 + tw + 52, 80], radius=10,
                            fill=(8, 13, 18, 225), outline=accent + (150,), width=2)
        d.rectangle([44, 30, 50, 80], fill=accent)
        d.text((66, 44), label, font=lf, fill=WHITE)
    # top right
    tr = "ANIMATIC · SCRATCH · 7:35"
    d.text((W - 48 - text_w(d, tr, F(18)), 42), tr, font=F(18), fill=(150, 160, 174))
    # lower band
    d.rectangle([0, 884, W, H], fill=(6, 10, 14, 218))
    d.rectangle([0, 884, W, 888], fill=accent)
    if band_label:
        d.text((60, 900), label, font=lf, fill=accent)
        stamp = "%d:%02d · %s" % (int(t) // 60, int(t) % 60, beat_name(t))
        d.text((60 + text_w(d, label, lf) + 28, 900), stamp, font=F(20, True), fill=(150, 160, 174))
    else:
        stamp = "%d:%02d · %s" % (int(t) // 60, int(t) % 60, beat_name(t))
        d.text((60, 900), stamp, font=F(20, True), fill=accent)
    tr2 = "%d / 455 s" % int(t)
    d.text((W - 60 - text_w(d, tr2, F(18)), 902), tr2, font=F(18), fill=(140, 150, 164))
    if vo:
        y = 936
        if any("\u0900" <= ch <= "\u097f" for ch in vo):
            f = F(30, mr=True)
            lines = textwrap.wrap(vo, width=76) or [vo]
        else:
            f = F(29)
            lines = textwrap.wrap(vo, width=96) or [vo]
        if len(lines) > 3:
            f = F(25)
            lines = textwrap.wrap(vo, width=112)
        for line in lines[:4]:
            d.text((60, y), line, font=f, fill=WHITE)
            y += 36
        if sub:
            d.text((60, y + 2), sub, font=F(22), fill=GREY)
    else:
        d.text((60, 946), "[visual hold · no line]", font=F(22), fill=(100, 112, 128))
    if footnote:
        d.text((60, 848), footnote, font=F(24), fill=(220, 226, 234))
    return im


def beat_name(t):
    for end, name in [(25, "BEAT 1 · HOOK"), (75, "BEAT 2 · PROBLEM"),
                      (105, "BEAT 3 · IDEA"), (195, "BEAT 4 · PROBE"),
                      (230, "BEAT 5 · HARDWARE"), (280, "BEAT 6 · GRID"),
                      (340, "BEAT 7 · AI"), (380, "BEAT 8 · DASHBOARD"),
                      (405, "BEAT 9 · STATUS"), (440, "BEAT 10 · IMPACT"),
                      (456, "BEAT 11 · CLOSE")]:
        if t < end:
            return name
    return "BEAT 11 · CLOSE"


# ---------------------------------------------------------------- segments

def S(a, b, src, label, accent, vo=None, sub=None, kind="still", ss=0.0, footnote=None,
      band_label=False):
    return dict(a=a, b=b, src=str(src), label=label, accent=accent, vo=vo,
                sub=sub, kind=kind, ss=ss, footnote=footnote, band_label=band_label)


def build_segments():
    P = A / "probe-stills"
    R1 = A / "round1-deck/slides"
    DV = A / "deck-visuals"
    HW = A / "hardware"
    DB = A / "dashboard"
    SAR = A / "sar"

    segs = []
    # Beat 1
    segs += [
        S(0, 7, P / "probe-ch01-flooded.jpg", "PROBE EXPLORER · ch1 · flooded paddy", GREEN,
          "India's rice paddies release about six and a half million tonnes of methane every year."),
        S(7, 15, P / "probe-ch01-flooded.jpg", "PROBE EXPLORER · ch1 · water starts to drop", GREEN,
          "Most of it comes from one habit: keeping fields flooded all season. The fix is already known."),
        S(15, 21, CARD / "face-1.png", "FACE CAM · TAKE 1 · HOOK", RED,
          "The problem is, it happens fifteen centimetres underground, where nobody can see."),
        S(21, 25, CARD / "title.png", "TITLE CARD", GREEN,
          "I'm Neeraj, and this is AGRI-GRID."),
    ]
    # Beat 2
    segs += [
        S(25, 38, P / "probe-ch01-flooded.jpg", "PROBE EXPLORER · ch1 · time-lapse", GREEN,
          "Flooded soil has no oxygen, so microbes in it make methane. IRRI's answer is alternate wetting and drying, AWD: let the water drop below the surface, then flood again."),
        S(38, 50, CARD / "stats.png", "CARD · AWD NUMBERS", AMBER,
          "It saves up to thirty percent of the water, and cuts methane by up to forty-eight percent. India grows rice on about fifty-one million hectares, so this matters."),
        S(50, 57, P / "probe-ch01-rule.jpg", "PROBE EXPLORER · ch1 · the −15 cm rule", GREEN,
          "But AWD has one rule: re-irrigate when the water is fifteen centimetres below the soil."),
        S(57, 75, R1 / "slide-03.jpg", "DECK · ROUND 1 · slide 3", AMBER,
          "Today a farmer checks that by hand, with a pipe, in one spot, if he has time. Nobody buying carbon credits can verify it was done. And satellites help, but radar only sees the top five centimetres."),
    ]
    # Beat 3
    segs += [
        S(75, 78, CARD / "diagram-0.png", "CARD · THREE LAYERS", AMBER,
          "So AGRI-GRID connects three layers."),
        S(78, 83, CARD / "diagram-1.png", "CARD · GROUND", GREEN,
          "Ground: a probe that reads water at four depths."),
        S(83, 88, CARD / "diagram-2.png", "CARD · SPACE", BLUE,
          "Space: Sentinel-1 radar over the whole farm."),
        S(88, 98, CARD / "diagram-3.png", "CARD · AI", AMBER,
          "And AI that turns both into one decision for the farmer, and one record anyone can check."),
        S(98, 105, P / "probe-ch02-xray.jpg", "PROBE EXPLORER · ch2 · probe top-down", GREEN,
          "Let me show you each piece, starting underground."),
    ]
    # Beat 4
    segs += [
        S(105, 115, P / "probe-ch02-names.jpg", "PROBE EXPLORER · ch2 · names and scale", GREEN,
          "This is the probe. A twenty-five millimetre tube, 3D-printed in PETG. White above the soil, black below."),
        S(115, 124, P / "probe-ch02-xray.jpg", "PROBE EXPLORER · ch2 · X-ray bands", GREEN,
          "Inside, four copper bands sit at zero to five, five to ten, ten to fifteen and fifteen to twenty centimetres."),
        S(124, 128, P / "probe-ch03-copper.jpg", "PROBE EXPLORER · ch3 · copper in pockets", GREEN,
          "It prints in two halves."),
        S(128, 133, P / "probe-ch03-wiring.jpg", "PROBE EXPLORER · ch3 · halves close", GREEN,
          "The copper goes into shallow pockets, and the halves seal with epoxy."),
        S(133, 139, P / "probe-ch04-wall.jpg", "PROBE EXPLORER · ch4 · 1.6 mm wall", GREEN,
          "The plastic wall is the insulator. No metal touches the soil, so nothing corrodes,"),
        S(139, 145, P / "probe-ch04-resistive.jpg", "PROBE EXPLORER · ch4 · resistive sensor", GREEN,
          "unlike the cheap two-prong sensors that rust in weeks."),
        S(145, 152, P / "probe-ch05-fringing.jpg", "PROBE EXPLORER · ch5 · fringing field", GREEN,
          "Each band is a capacitor. Its electric field reaches through the wall into the soil."),
        S(152, 167, P / "probe-ch05-curve.jpg", "PROBE EXPLORER · ch5 · ε → θ curve", GREEN,
          "Water has a permittivity of about eighty; dry soil, about four. So as soil gets wetter, capacitance rises, and the ESP32's touch pins measure it directly. A published equation, Topp 1980, turns that into water content."),
        S(167, 173, P / "probe-ch06-guards.jpg", "PROBE EXPLORER · ch6 · guard rings", GREEN,
          "Guard rings make sure each band reads only its own slice of soil."),
        S(173, 188, P / "probe-ch08-drying.jpg", "PROBE EXPLORER · ch8 · one drying cycle", GREEN,
          "Here is one drying cycle: about ten days in a few seconds. The water strip follows the flood down. Then the bands dry, top to bottom."),
        S(188, 195, P / "probe-ch08-irrigate.jpg", "PROBE EXPLORER · ch8 · IRRIGATE NOW", GREEN,
          "At minus fifteen, the node flags: irrigate."),
    ]
    # Beat 5
    segs += [
        S(195, 198, CARD / "face-2.png", "FACE CAM · TAKE 2 · BENCH", RED,
          "This is what's on our bench today."),
        S(198, 201, HW / "gateway-electronics-1080p.mp4", "HARDWARE · gateway exterior", ORANGE,
          "The gateway prototype: the box that sits at the farmhouse.", kind="clip", ss=0.0),
        S(201, 206, HW / "gateway-internals-closeup.mp4", "HARDWARE · IOTPS-Mini + controller board", ORANGE,
          "Mains-powered, with the power module", kind="clip", ss=1.0),
        S(206, 210, HW / "gateway-frame-30s.jpg", "HARDWARE · internals · second angle", ORANGE,
          "and the controller board inside."),
        S(210, 216, HW / "gateway-electronics-1080p.mp4", "HARDWARE · powered on · green LED", ORANGE,
          "And here it is powered on.", kind="clip", ss=0.0),
        S(216, 221, CARD / "build-sheet.png", "BUILD SHEET · page 1", AMBER,
          "The probes and field nodes are being built to the design you just saw."),
        S(221, 225, A / "prototype-circuits/png/hero.png", "CIRCUIT · system diagram", AMBER,
          "The node electronics follow our build sheet."),
        S(225, 230, HW / "esp32-bench-wiring-1.jpg", "BENCH · ESP32 + radio wiring", ORANGE,
          None),
    ]
    # Beat 6
    segs += [
        S(230, 242, P / "probe-ch09-leak.jpg", "PROBE EXPLORER · ch9 · four nodes", GREEN,
          "In the field, every node sends its readings to that gateway over ESP-NOW, the ESP32's own radio. No Wi-Fi network, and no SIM card on each node."),
        S(242, 252, P / "probe-ch09-leak.jpg", "PROBE EXPLORER · ch9 · B2 leaking bund", GREEN,
          "Here, node B2 is losing water three times faster than its neighbours. That isn't normal drying. That's a leaking bund."),
        S(252, 258, P / "probe-ch17-sms.jpg", "PROBE EXPLORER · ch17 · phone lock screen", GREEN,
          "The farmer never sees any of the backend. He gets one SMS, in Marathi:"),
        S(258, 264, P / "probe-ch17-sms.jpg", "PROBE EXPLORER · ch17 · SMS thread", GREEN,
          "शेत सुकत आहे. २–३ दिवसांत पाणी देण्याची तयारी ठेवा.",
          sub="Field is drying. Plan to irrigate in 2–3 days."),
        S(264, 280, P / "probe-ch17-app.jpg", "PROBE EXPLORER · ch17 · app opens", GREEN,
          "One tap opens the app: today's water level, the plan, the rain forecast, and a button to call an agronomist."),
    ]
    # Beat 7
    segs += [
        S(280, 286, P / "probe-ch17-pipeline.jpg", "PROBE EXPLORER · ch17 · pipeline cards", GREEN,
          "Now, where the AI does its work. Three models, each with one job."),
        S(286, 295, P / "probe-ch11-calibration.jpg", "PROBE EXPLORER · ch11 · calibration", GREEN,
          "First, calibration: it turns raw counts into water content, fitted to oven-dried samples of local soil."),
        S(295, 305, P / "probe-ch09-leak.jpg", "PROBE EXPLORER · ch9 · anomaly view", GREEN,
          "Second, anomaly detection: an Isolation Forest compares how fast each node dries. That's how B2's leak gets caught."),
        S(305, 317, SAR / "sar-triptych-1920x1080.png", "SAR · REAL U-NET OUTPUT · SPAIN TEST CHIP", VIOLET,
          "Third, space. We trained a U-Net on Sentinel-1 radar to map water across whole fields. Here is a radar chip, our prediction, and the ground truth.",
          band_label=True),
        S(317, 325, SAR / "sar-metrics-card-1920x1080.png", "SAR · 89-CHIP MEAN · 0.3817", VIOLET,
          "Per-chip mean IoU is zero point three eight. A working first model, and the number we'll push up with more labelled fields."),
        S(325, 340, DV / "08_slide_08_evidence_visual.jpg", "DECK VISUAL · EVIDENCE ENGINE", AMBER,
          "And the part I care most about: the disagreement engine. If the probe says wet and the radar says dry, we don't average them. We flag the field for a person to check. That's what makes the record trustworthy."),
    ]
    # Beat 8
    segs += [
        S(340, 350, DB / "dash-overview.png", "DASHBOARD · DEMO MODE · farm view", BLUE,
          "All of this lands on one dashboard. This is the farm view, every field coloured by its state."),
        S(350, 362, DB / "field-top.png", "DASHBOARD · DEMO MODE · field MVL-01", BLUE,
          "Open a field and you get today's decision, the four probe bands, the water history and the SMS that went out."),
        S(362, 372, DB / "field-charts.png", "DASHBOARD · DEMO MODE · 48 h + 3D field", BLUE,
          "Weather comes from open data for that exact location. Field officers and farmer groups use this view; farmers just get the SMS."),
        S(372, 380, DB / "home-probe.png", "SITE · PROBE SECTION → EXPLORER", BLUE,
          "And this explorer, which you've been watching, is part of the site too: anyone can open it and learn how the probe works."),
    ]
    # Beat 9
    segs += [
        S(380, 393, CARD / "honesty-1.png", "CARD · STATUS", AMBER,
          "To be clear about where we are. The gateway hardware, the dashboard and the explorer are built. The SAR model is trained. The probe is designed and being printed."),
        S(393, 405, CARD / "honesty-2.png", "CARD · STATUS + NEXT", AMBER,
          "Probe readings you saw are simulated, and the thresholds are illustrative until we calibrate in real soil. That calibration is the first job of our pilot."),
    ]
    # Beat 10
    segs += [
        S(405, 417, P / "probe-ch18-ipcc.jpg", "PROBE EXPLORER · ch18 · IPCC card", GREEN,
          "Why this is worth building: on one hectare, IPCC defaults put continuous flooding at around a hundred and forty kilograms of methane a season, and AWD at around eighty."),
        S(417, 423, R1 / "slide-14.jpg", "DECK · ROUND 1 · ₹14,995 cost card", AMBER,
          "Our prototype setup, three field nodes and a gateway, costs about fifteen thousand rupees."),
        S(423, 431, DV / "09_slide_09_business_model_visual.jpg", "DECK VISUAL · GO TO MARKET", AMBER,
          "We start with farmer producer organisations, then KVK pilots,"),
        S(431, 440, DV / "10_slide_10_scale_visual.jpg", "DECK VISUAL · SAME PLATFORM", AMBER,
          "then use the same records for methane-credit verification. And the platform carries over to sugarcane, wheat and cotton."),
    ]
    # Beat 11
    segs += [
        S(440, 450, CARD / "face-3.png", "FACE CAM · TAKE 3 · CLOSE", RED,
          "The decision happens fifteen centimetres underground. AGRI-GRID sees it, tells the farmer, and proves it."),
        S(450, 455, R1 / "slide-01.jpg", "DECK · ROUND 1 · title slide", AMBER,
          "I'm Neeraj Parekh, team FusionForge. Thank you.",
          footnote="Team FusionForge · Mentor: Trupti Bhalerao · MIT Academy of Engineering"),
    ]
    return segs


# ---------------------------------------------------------------- render

def render_still(seg):
    src = Path(seg["src"])
    im = fit(src) if src.suffix.lower() in (".jpg", ".jpeg", ".png") else Image.new("RGB", (W, H), INK)
    ov = overlay(seg["label"], seg["vo"], seg["a"], seg["accent"], seg["sub"],
                 seg["footnote"], seg["band_label"])
    im = Image.alpha_composite(im.convert("RGBA"), ov).convert("RGB")
    out_png = COMP / ("%03d.png" % seg["a"])
    im.save(out_png)
    out = SEGDIR / ("%03d.mp4" % seg["a"])
    dur = seg["b"] - seg["a"]
    cmd = ["ffmpeg", "-v", "error", "-y", "-loop", "1", "-framerate", str(FPS),
           "-i", str(out_png), "-t", str(dur), "-c:v", "libx264", "-preset", "veryfast",
           "-crf", "24", "-pix_fmt", "yuv420p", "-r", str(FPS), str(out)]
    subprocess.run(cmd, check=True)
    return out


def render_clip(seg):
    src = Path(seg["src"])
    dur = seg["b"] - seg["a"]
    ov = overlay(seg["label"], seg["vo"], seg["a"], seg["accent"], seg["sub"],
                 seg["footnote"], seg["band_label"])
    ov_png = OVDIR / ("%03d.png" % seg["a"])
    ov.save(ov_png)
    out = SEGDIR / ("%03d.mp4" % seg["a"])
    fc = ("[0:v]scale=%d:%d:force_original_aspect_ratio=increase,crop=%d:%d,"
          "setsar=1,fps=%d[v];[v][1:v]overlay=0:0,format=yuv420p[o]" % (W, H, W, H, FPS))
    cmd = ["ffmpeg", "-v", "error", "-y", "-ss", str(seg["ss"]), "-t", str(dur),
           "-i", str(src), "-i", str(ov_png), "-filter_complex", fc,
           "-map", "[o]", "-an", "-t", str(dur), "-c:v", "libx264",
           "-preset", "veryfast", "-crf", "24", "-pix_fmt", "yuv420p", "-r", str(FPS),
           str(out)]
    subprocess.run(cmd, check=True)
    return out


def write_cues(segs):
    lines = ["# Voice-over cues · 7:35 animatic",
             "",
             "Record each line against the animatic. The in-point is the shot start; the",
             "out-point is the next shot. Leave half a second of room tone at both ends.",
             "",
             "| In | Out | Beat | Shot | Line |",
             "|---|---|---|---|---|"]
    for s in segs:
        if not s["vo"]:
            continue
        vo = s["vo"] + ((" / " + s["sub"]) if s["sub"] else "")
        lines.append("| %s | %s | %s | %s | %s |" % (
            tc(s["a"]), tc(s["b"]), beat_name(s["a"]), s["label"], vo.replace("|", "/")))
    lines += ["", "Total 7:35 (455 s).", ""]
    (HERE / "VO-CUES.md").write_text("\n".join(lines), encoding="utf-8")

    def ts(t):
        h = int(t // 3600); m = int((t % 3600) // 60); sec = int(t % 60); ms = int(round((t - int(t)) * 1000))
        return "%02d:%02d:%02d,%03d" % (h, m, sec, ms)
    out = []
    for i, s in enumerate([x for x in segs if x["vo"]], 1):
        text = s["vo"] + ((" " + s["sub"]) if s["sub"] else "")
        out += [str(i), "%s --> %s" % (ts(s["a"]), ts(s["b"])), text, ""]
    (HERE / "AGRI-GRID-Round2-animatic.srt").write_text("\n".join(out), encoding="utf-8")


def tc(t):
    return "%d:%02d" % (int(t) // 60, int(t) % 60)


def main():
    # cards
    title_card().save(CARD / "title.png")
    stats_card().save(CARD / "stats.png")
    for i in range(4):
        diagram_card(i).save(CARD / ("diagram-%d.png" % i))
    honesty_card(1).save(CARD / "honesty-1.png")
    honesty_card(2).save(CARD / "honesty-2.png")
    face_card(1, "hook · 6 s · eye level").save(CARD / "face-1.png")
    face_card(2, "bench · 3 s · box in frame").save(CARD / "face-2.png")
    face_card(3, "close · 10 s · straight to camera").save(CARD / "face-3.png")
    build_sheet_page().save(CARD / "build-sheet.png")
    print("cards done", flush=True)

    segs = build_segments()
    assert abs(sum(s["b"] - s["a"] for s in segs) - TOTAL) < 0.01, sum(s["b"] - s["a"] for s in segs)
    for s in segs:
        assert Path(s["src"]).exists(), s["src"]
    print("segments", len(segs), "total", sum(s["b"] - s["a"] for s in segs), flush=True)

    outs = []
    for i, s in enumerate(segs, 1):
        out = render_clip(s) if s["kind"] == "clip" else render_still(s)
        outs.append(out)
        print("%02d/%d  %s  %s" % (i, len(segs), tc(s["a"]), out.name), flush=True)

    concat = BUILD / "concat.txt"
    concat.write_text("".join("file '%s'\n" % p for p in outs))
    base = BUILD / "animatic-silent.mp4"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0",
                    "-i", str(concat), "-c", "copy", str(base)], check=True)
    shutil.copy(base, HERE / "AGRI-GRID-Round2-animatic-scratch-1080p.mp4")
    write_cues(segs)
    print("wrote", HERE / "AGRI-GRID-Round2-animatic-scratch-1080p.mp4", flush=True)


if __name__ == "__main__":
    main()
