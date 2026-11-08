#!/usr/bin/env python3
"""Card renderers for the AGRI-GRID Round 2 film.

Every function returns a 1920x1080 RGB frame for a local time `t` inside a
`dur`-second shot. The cards are deliberately paper-and-ink: cream stock, forest
type, one accent per beat, mono numerals. Photographs stay full-bleed and are
handled by the builder, not here.
"""
from PIL import Image, ImageDraw
from pathlib import Path
import math
import qrcode

from film_style import (
    W, H, PAPER, PAPER_2, WHITE, INK, FOREST, FOREST_2, GREEN, ACCENT,
    WATER, SOFT, AMBER, RED, MUTED, BORDER, GREY,
    font, tw, tracked, tracked_width, wrap, clamp, ease_out, ease_in_out,
    ease_out_back, lerp, appear, cover, contain, rounded, shadow, paper_base,
    dark_base, add_paper_grain, dot_grid, kicker, pill, check_icon, arrow_icon,
    rule, tc, beat_name, C,
)

A = Path("/mnt/20265E15265DEC72/study/CODE/HACKATHON/temp/documentation/round2/assets")
M = 96          # side margin
HEAD = 132      # header rule
FOOT = 962      # footer rule

_shells = {}
_dark_shells = {}
_qr = None


# ------------------------------------------------------------------ helpers
def _shell(kick, right, source=None, page=None, tint=PAPER):
    key = (kick, right, source, page, tint)
    if key in _shells:
        return _shells[key].copy()
    im = paper_base(tint)
    im = dot_grid(im, 54, (22, 35, 29), 7)
    d = ImageDraw.Draw(im, "RGBA")
    tracked(d, (M, 54), kick.upper(), font("mono_b", 17), GREEN + (235,), 3.0)
    f = font("mono", 16)
    w = tracked_width(d, right.upper(), f, 2.6)
    tracked(d, (W - M - w, 54), right.upper(), f, MUTED + (235,), 2.6)
    if source:
        f2 = font("mono", 13)
        w2 = tracked_width(d, source.upper(), f2, 1.5)
        tracked(d, (W - M - w2, 84), source.upper(), f2, GREY + (225,), 1.5)
    rule(d, M, HEAD, W - M, BORDER + (255,), 2)
    _shells[key] = im
    return im.copy()


def _title(im, s, y=176, size=72, color=INK, weight="black", max_w=W - 2 * M):
    d = ImageDraw.Draw(im, "RGBA")
    f = font(weight, size)
    lines = wrap(d, s, f, max_w)
    yy = y
    for line in lines:
        d.text((M, yy), line, font=f, fill=color)
        yy += int(size * 1.08)
    return yy


def _stamp(im, x, y, n, color=GREEN, size=150, alpha=255):
    d = ImageDraw.Draw(im, "RGBA")
    d.text((x, y), n, font=font("black", size), fill=color + (alpha,))


def count(t, start, dur, value, fmt="{:.0f}"):
    v = value * ease_out((t - start) / dur) if dur > 0 else value
    return fmt.format(v)


def bar(d, x, y, w, h, frac, color, track=(229, 232, 224, 255), radius=4):
    d.rounded_rectangle([x, y, x + w, y + h], radius=radius, fill=track)
    fw = max(0, int(w * clamp(frac)))
    if fw > 2:
        d.rounded_rectangle([x, y, x + fw, y + h], radius=radius, fill=color)


def rec_dot(im, x, y, t):
    a = 0.45 + 0.55 * (0.5 + 0.5 * math.sin(t * 4.4))
    d = ImageDraw.Draw(im, "RGBA")
    d.ellipse([x, y, x + 16, y + 16], fill=(210, 70, 55, int(255 * a)))


# ------------------------------------------------------------------ 1 title
def title_card(t, dur):
    im = dark_base(FOREST_2)
    # right-hand photograph, faded into the forest
    photo = cover(Image.open(A / "deck-visuals/01_slide_01_title_visual.jpg"))
    mask = Image.new("L", (W, H), 0)
    md = ImageDraw.Draw(mask)
    for x in range(W):
        v = int(255 * clamp((x - W * 0.38) / (W * 0.42)) ** 0.8)
        md.line([(x, 0), (x, H)], fill=v)
    im = Image.composite(photo, im, mask)
    # green wash on top of photo for brand consistency
    wash = Image.new("RGBA", (W, H), (7, 59, 42, 96))
    im = Image.alpha_composite(im.convert("RGBA"), wash).convert("RGB")

    d = ImageDraw.Draw(im, "RGBA")
    # left dark panel
    panel = Image.new("RGBA", (1000, H), (6, 40, 29, 236))
    im.paste(panel, (0, 0), panel)
    d = ImageDraw.Draw(im, "RGBA")
    d.rectangle([0, 0, 8, H], fill=ACCENT)

    a = appear(t, 0.05, 0.5)
    tracked(d, (84, 232), "TEAM FUSIONFORGE · ROUND 2 · 2026", font("mono_b", 19),
            ACCENT + (int(255 * a),), 3.4)

    rise = 46 * (1 - appear(t, 0.15, 0.7))
    d.text((80, int(296 - rise)), "AGRI-GRID", font=font("black", 146), fill=WHITE + (int(255 * appear(t, 0.15, 0.7)),))

    # rule draws in
    rw = int(150 * ease_out((t - 0.45) / 0.6))
    d.rectangle([84, 486, 84 + rw, 492], fill=ACCENT)

    a2 = appear(t, 0.55, 0.6)
    d.text((84, 540), "Ground truth for rice.", font=font("medium", 44), fill=(238, 243, 236, int(255 * a2)))

    a3 = appear(t, 0.85, 0.6)
    d.text((84, 690), "A probe, a radar model and one verifiable record", font=font("regular", 25),
           fill=(180, 198, 187, int(255 * a3)))
    d.text((84, 730), "for alternate wetting and drying.", font=font("regular", 25),
           fill=(180, 198, 187, int(255 * a3)))

    a4 = appear(t, 1.05, 0.6)
    tracked(d, (84, 916), "MIT ACADEMY OF ENGINEERING · PUNE", font("mono", 16),
            (170, 190, 178, int(225 * a4)), 2.2)
    tracked(d, (84, 946), "AGRI-GRID-CHI.VERCEL.APP", font("mono_b", 20),
            ACCENT + (int(225 * a4),), 2.2)
    tracked(d, (W - 64 - tracked_width(d, "CONCEPT VISUAL · AI-GENERATED", font("mono", 13), 1.6), H - 46),
            "CONCEPT VISUAL · AI-GENERATED", font("mono", 13), (200, 214, 204, 150), 1.6)
    return im


# ------------------------------------------------------------------ 2 stats
def stats_card(t, dur):
    im = _shell("THE FIX IS ALREADY KNOWN", "02 · THE PROBLEM",
                "IRRI AWD PRACTICE · DA&FW 2024-25 RICE AREA · FIGURES AS CITED IN THE SCRIPT")
    d = ImageDraw.Draw(im, "RGBA")
    _title(im, "The fix is already known.", 174, 76)
    d = ImageDraw.Draw(im, "RGBA")
    d.text((M, 292), "Alternate wetting and drying is standard practice, not a research bet.",
           font=font("regular", 27), fill=MUTED)

    # dominant figure: water
    a = appear(t, 0.10, 0.5)
    tracked(d, (M, 400), "WATER", font("mono_b", 20), GREEN + (int(255 * a),), 3.2)
    f = font("mono_b", 128)
    val = count(t, 0.10, 1.0, 30, "{:.0f}").replace("-", "\u2212")
    d.text((M - 4, 436), "\u2212" + val, font=f, fill=INK + (int(255 * a),))
    d.text((M + 268, 520), "%", font=font("mono_b", 40), fill=GREEN + (int(255 * a),))
    d.text((M, 606), "less water than continuous flooding", font=font("regular", 25),
           fill=INK + (int(255 * a),))
    bar(d, M, 664, 760, 10, 0.30 * ease_out((t - 0.3) / 0.9), GREEN, radius=0)

    # supporting figures
    subs = [
        ("\u221248", "%", "METHANE", "less methane than continuous flooding", WATER, 0.48, 0.35),
        ("51.3", "Mha", "RICE AREA", "the area this can be applied to in India", AMBER, 0.72, 0.50),
    ]
    for i, (num, unit, label, desc, col, frac, start) in enumerate(subs):
        x = 1010
        y = 400 + i * 210
        aa = appear(t, start, 0.5)
        if aa <= 0:
            continue
        tracked(d, (x, y), label, font("mono_b", 18), col + (int(255 * aa),), 3.0)
        vs = count(t, start, 0.9, float(num.replace("\u2212", "-")), "{:.1f}" if "." in num else "{:.0f}")
        vs = vs.replace("-", "\u2212")
        d.text((x - 2, y + 30), vs, font=font("mono_b", 72), fill=INK + (int(255 * aa),))
        vw = d.textbbox((0, 0), vs, font=font("mono_b", 72))[2]
        d.text((x + vw + 8, y + 62), unit, font=font("mono_b", 24), fill=col + (int(255 * aa),))
        d.text((x, y + 122), desc, font=font("regular", 22), fill=MUTED + (int(255 * aa),))
        bar(d, x, y + 160, 720, 8, frac * ease_out((t - start - 0.2) / 0.8), col + (int(230 * aa),), radius=0)

    a = appear(t, 0.75, 0.6)
    d.rounded_rectangle([M, 806, W - M, 884], radius=10, fill=(255, 255, 255, int(190 * a)),
                        outline=BORDER + (int(255 * a),), width=2)
    d.text((M + 26, 826), "The rule is simple. The proof is what is missing.",
           font=font("semibold", 27), fill=FOREST + (int(255 * a),))
    return im


def gaps_card(t, dur):
    im = _shell("WHY IT IS STILL NOT SOLVED", "02 · THE PROBLEM",
                "ROUND 1 DECK · PROBE EXPLORER · PROBLEM STATEMENT")
    _title(im, "Three gaps between the rule and the field.", 172, 62)
    d = ImageDraw.Draw(im, "RGBA")
    d.text((M, 258), "The rule is simple. The proof is what is missing.", font=font("regular", 25), fill=MUTED)
    rows = [
        ("01", "CHECKED BY HAND", "One spot, one pipe, if there is time.",
         "A farmer samples a single point. The rest of the field is a guess.", GREEN),
        ("02", "NO VERIFIABLE RECORD", "A buyer cannot confirm the field was dried.",
         "Carbon credits need a timestamped, field-level record. Today there is none.", AMBER),
        ("03", "RADAR SEES 5 CM", "Sentinel-1 reads the surface, not the root zone.",
         "The water that matters is fifteen centimetres down.", WATER),
    ]
    y = 348
    for i, (n, head, lead, body, col) in enumerate(rows):
        a = appear(t, 0.2 + i * 0.22, 0.7)
        if a <= 0:
            continue
        yy = y + i * 186
        d.rectangle([M, yy, M + 4, yy + 128], fill=col + (int(255 * a),))
        d.text((M + 30, yy - 8), n, font=font("mono_b", 42), fill=col + (int(255 * a),))
        tracked(d, (M + 128, yy + 4), head, font("mono_b", 22), INK + (int(255 * a),), 2.2)
        d.text((M + 128, yy + 44), lead, font=font("medium", 30), fill=INK + (int(255 * a),))
        d.text((M + 128, yy + 92), body, font=font("regular", 23), fill=MUTED + (int(255 * a),))
    return im


# ------------------------------------------------------------------ 4 system
def system_card(stage, t, dur):
    im = _shell("THE IDEA", "03 · THE IDEA")
    _title(im, "Three layers. One decision.", 172, 66)
    d = ImageDraw.Draw(im, "RGBA")

    rows = [
        ("01", "GROUND", "A probe reads water at four depths: 0-5, 5-10, 10-15, 15-20 cm.", GREEN),
        ("02", "SPACE", "Sentinel-1 radar covers the whole farm.", WATER),
        ("03", "AI", "One action for the farmer, one record for a buyer.", AMBER),
    ]
    y0 = 286
    for i, (n, name, desc, col) in enumerate(rows):
        on = stage >= i + 1
        a = appear(t, 0.15 + i * 0.18, 0.55) if on else 0.0
        y = y0 + i * 162
        # ghost row
        if not on:
            d.rounded_rectangle([M, y, W - M, y + 132], radius=12,
                                fill=(255, 255, 255, 70), outline=BORDER + (170,), width=2)
            d.text((M + 34, y + 32), n, font=font("mono_b", 34), fill=(22, 35, 29, 45))
            tracked(d, (M + 120, y + 38), name, font("mono_b", 24), (22, 35, 29, 55), 3.0)
            d.text((M + 120, y + 78), desc, font=font("regular", 25), fill=(22, 35, 29, 45))
            continue
        d.rounded_rectangle([M, y, W - M, y + 146], radius=12,
                            fill=WHITE + (235,), outline=col + (110,), width=2)
        d.rectangle([M, y, M + 6, y + 146], fill=col + (255,))
        d.text((M + 34, y + 30), n, font=font("mono_b", 36), fill=col + (int(255 * a),))
        tracked(d, (M + 122, y + 26), name, font("mono_b", 26), INK + (int(255 * a),), 3.2)
        d.text((M + 122, y + 70), desc, font=font("medium", 28), fill=INK + (int(255 * a),))
        # right signal glyph
        _glyph(d, i, W - M - 96, y + 73, col + (int(240 * a),))

    if stage >= 3:
        a = appear(t, 0.7, 0.7)
        d.text((M, 778), "OUTPUT", font=font("mono_b", 16), fill=MUTED + (int(255 * a),))
        for x, label, sub, col in [
            (M, "FARMER", "one SMS, one action", GREEN),
            (M + 470, "EVIDENCE", "timestamped record", WATER),
        ]:
            d.rounded_rectangle([x, 812, x + 440, 888], radius=10, fill=WHITE + (int(220 * a),),
                                outline=col + (int(180 * a),), width=2)
            tracked(d, (x + 22, 826), label, font("mono_b", 18), col + (int(255 * a),), 2.6)
            d.text((x + 22, 854), sub, font=font("regular", 22), fill=INK + (int(255 * a),))
    return im


def _glyph(d, kind, x, y, color):
    """Small line glyphs: probe, satellite, node graph."""
    if kind == 0:
        d.rounded_rectangle([x - 10, y - 44, x + 10, y + 44], radius=8, outline=color, width=3)
        for k in range(1, 4):
            yy = y - 44 + k * 22
            d.line([(x - 10, yy), (x + 10, yy)], fill=color, width=2)
    elif kind == 1:
        d.arc([x - 46, y - 6, x + 46, y + 54], 200, 340, fill=color, width=3)
        d.rectangle([x - 8, y - 40, x + 8, y - 24], outline=color, width=3)
        d.line([(x, y - 24), (x, y - 8)], fill=color, width=2)
        d.line([(x - 26, y + 22), (x + 26, y + 22)], fill=color, width=2)
    else:
        pts = [(x - 34, y + 20), (x, y - 30), (x + 34, y + 20)]
        for px, py in pts:
            d.ellipse([px - 7, py - 7, px + 7, py + 7], outline=color, width=3)
        d.line([pts[0], pts[1]], fill=color, width=2)
        d.line([pts[1], pts[2]], fill=color, width=2)


# ------------------------------------------------------------------ 5 pipeline
def pipeline_card(t, dur):
    im = _shell("THE AI", "07 · THE AI")
    _title(im, "Three models, one job each.", 172, 66)
    d = ImageDraw.Draw(im, "RGBA")

    stops = [
        ("CALIBRATE", "Raw counts to water content.", "Topp 1980, fitted to oven-dried local soil.", GREEN),
        ("DETECT", "Isolation Forest on drying rate.", "Catches a node losing water three times faster.", AMBER),
        ("MAP", "ResNet-34 U-Net on Sentinel-1.", "Water across the field, not one point.", WATER),
    ]
    x0, x1 = 300, 1580
    y = 512
    # track draws on
    draw = ease_out((t - 0.15) / 1.0)
    d.line([(x0, y), (x0 + (x1 - x0) * draw, y)], fill=(190, 198, 188), width=4)
    for i, (head, lead, body, col) in enumerate(stops):
        cx = x0 + (x1 - x0) * i / 2
        a = appear(t, 0.35 + i * 0.22, 0.45)
        if a <= 0:
            continue
        # landing ring
        d.ellipse([cx - 19, y - 19, cx + 19, y + 19], fill=PAPER, outline=col + (int(255 * a),), width=5)
        d.ellipse([cx - 8, y - 8, cx + 8, y + 8], fill=col + (int(255 * a),))
        d.text((cx - 11, y - 66), str(i + 1), font=font("mono_b", 20), fill=col + (int(255 * a),))
        tracked(d, (cx, y + 44), head, font("mono_b", 21), col + (int(255 * a),), 2.6, anchor="mt")
        for j, line in enumerate(wrap(d, lead, font("medium", 25), 340)):
            d.text((cx, y + 82 + j * 33), line, font=font("medium", 25), fill=INK + (int(255 * a),), anchor="mt")
        for j, line in enumerate(wrap(d, body, font("regular", 19), 340)):
            d.text((cx, y + 154 + j * 28), line, font=font("regular", 19), fill=MUTED + (int(255 * a),), anchor="mt")

    a = appear(t, 1.0, 0.6)
    d.text((M, 806), "Their outputs meet in the evidence engine, not in an average.",
           font=font("semibold", 27), fill=FOREST + (int(255 * a),))
    return im


def sar_triptych_card(t, dur):
    im = _shell("SENTINEL-1 · SPAIN TEST CHIP", "07 · THE AI",
                "SEN1FLOODS11 OFFICIAL TEST · SPAIN_7370579 · 512 x 512 CHIP", "REAL U-NET OUTPUT")
    _title(im, "Radar in. Water map out.", 150, 54)
    d = ImageDraw.Draw(im, "RGBA")

    panels = [
        ("VV INPUT", "sar-panel-vv.jpg", "2-channel input, VV shown", None),
        ("U-NET PREDICTION", "sar-panel-pred.jpg", "water at threshold 0.50", WATER),
        ("HAND LABEL", "sar-panel-gt.jpg", "independent ground truth", GREEN),
    ]
    pw = 468
    gap = 60
    x0 = (W - (pw * 3 + gap * 2)) // 2
    y0 = 270
    for i, (label, fn, sub, col) in enumerate(panels):
        a = appear(t, 0.15 + i * 0.18, 0.7)
        if a <= 0:
            continue
        x = x0 + i * (pw + gap)
        y = int(y0 + 18 * (1 - a))
        img = contain(Image.open(A / "sar" / fn), pw, pw)
        im.paste(img, (x, y))
        d.rectangle([x, y, x + pw - 1, y + pw - 1], outline=(22, 35, 29, int(120 * a)), width=2)
        tracked(d, (x, y - 30), label, font("mono_b", 16),
                (col or INK) + (int(255 * a),), 2.2)
        d.text((x, y + pw + 12), sub, font=font("regular", 18), fill=MUTED + (int(255 * a),))

    a = appear(t, 0.8, 0.7)
    y = 790
    d.rounded_rectangle([M, y, W - M, y + 92], radius=10, fill=WHITE + (int(220 * a),),
                        outline=BORDER + (int(255 * a),), width=2)
    d.text((M + 26, y + 16), "Per-chip water IoU", font=font("regular", 24), fill=MUTED + (int(255 * a),))
    d.text((M + 250, y + 6), "0.6136", font=font("mono_b", 46), fill=GREEN + (int(255 * a),))
    d.text((M + 470, y + 22), "on this chip. The mean over 89 test chips is 0.3817.",
           font=font("regular", 23), fill=INK + (int(255 * a),))
    d.text((M + 26, y + 58), "Flood-water model, not a paddy classifier.", font=font("regular", 18),
           fill=AMBER + (int(255 * a),))
    return im


# ------------------------------------------------------------------ 7 SAR metrics
def sar_metrics_card(t, dur):
    im = _shell("SEN1FLOODS11 · OFFICIAL TEST", "07 · THE AI",
                "89 OF 90 SPLIT CHIPS LOAD · THRESHOLD 0.50 · 10 FLOOD EVENTS", "TEST MEAN")
    d = ImageDraw.Draw(im, "RGBA")
    tracked(d, (M, 176), "MEAN IoU ACROSS THE TEST SPLIT", font("mono_b", 19), GREEN, 3.0)
    val = count(t, 0.1, 1.4, 0.3817, "{:.4f}")
    d.text((M - 6, 220), val, font=font("mono_b", 160), fill=FOREST)
    d.text((M, 438), "89 loaded test chips · fixed 0.50 threshold · ResNet-34 U-Net",
           font=font("regular", 26), fill=MUTED)

    # scale 0..1
    sx, sy, sw = M, 540, 940
    d.line([(sx, sy), (sx + sw, sy)], fill=(210, 216, 206), width=3)
    for k in range(0, 11):
        xx = sx + sw * k / 10
        d.line([(xx, sy - 8), (xx, sy + 8)], fill=(190, 198, 188), width=2)
        d.text((xx - 8, sy + 16), str(k / 10), font=font("mono", 13), fill=GREY)
    mx = sx + sw * (0.3817 * ease_out((t - 0.4) / 1.0))
    d.polygon([(mx, sy - 12), (mx - 10, sy - 30), (mx + 10, sy - 30)], fill=AMBER)
    d.line([(mx, sy - 12), (mx, sy)], fill=AMBER, width=3)

    subs = [("water IoU", 0.6209, GREEN), ("precision", 0.6927, WATER), ("recall", 0.8569, AMBER)]
    for i, (label, v, col) in enumerate(subs):
        y = 632 + i * 82
        a = appear(t, 0.5 + i * 0.12, 0.6)
        d.text((M, y), label, font=font("medium", 23), fill=INK + (int(255 * a),))
        d.text((M + 210, y - 10), count(t, 0.5 + i * 0.12, 1.0, v, "{:.4f}"),
               font=font("mono_b", 34), fill=col + (int(255 * a),))
        bar(d, M + 410, y + 4, 520, 8, v * ease_out((t - 0.5 - i * 0.12) / 1.0), col + (int(230 * a),))

    a = appear(t, 1.0, 0.7)
    d.text((M, 872), "A working first model. 0.4122 ± 0.0071 is a validation band, not a test result.",
           font=font("regular", 20), fill=MUTED + (int(255 * a),))
    return im


# ------------------------------------------------------------------ 8 disagreement
def disagreement_card(t, dur):
    im = _shell("THE EVIDENCE ENGINE", "07 · THE AI")
    _title(im, "When the probe and radar disagree, we do not average.", 166, 58, max_w=1500)
    d = ImageDraw.Draw(im, "RGBA")

    # inputs
    boxes = [
        (M, 340, 380, 470, "PROBE", "water at 15 cm", GREEN),
        (M, 500, 380, 630, "RADAR", "water at the surface", WATER),
    ]
    for x0, y0, x1, y1, name, sub, col in boxes:
        a = appear(t, 0.15, 0.6)
        d.rounded_rectangle([x0, y0, x1, y1], radius=12, fill=WHITE + (int(235 * a),),
                            outline=col + (int(160 * a),), width=2)
        tracked(d, (x0 + 24, y0 + 22), name, font("mono_b", 22), col + (int(255 * a),), 2.6)
        d.text((x0 + 24, y0 + 58), sub, font=font("regular", 22), fill=INK + (int(255 * a),))

    # diamond
    cx, cy = 760, 485
    a = appear(t, 0.35, 0.6)
    d.polygon([(cx, cy - 78), (cx + 112, cy), (cx, cy + 78), (cx - 112, cy)],
              fill=PAPER_2 + (int(255 * a),), outline=FOREST + (int(180 * a),))
    d.text((cx - 46, cy - 18), "AGREE?", font=font("semibold", 25), fill=FOREST + (int(255 * a),))

    # lines
    for x0, y0 in [(380, 405), (380, 565)]:
        d.line([(x0, y0), (cx - 120, cy + (y0 - cy) * 0.55)], fill=FOREST + (int(120 * a),), width=3)

    # outputs
    outs = [
        (1030, 360, 1470, 470, "RECORD IT", "both agree · timestamped", GREEN),
        (1030, 520, 1470, 630, "FLAG IT", "a person checks the field", AMBER),
    ]
    for x0, y0, x1, y1, name, sub, col in outs:
        a2 = appear(t, 0.55, 0.6)
        d.rounded_rectangle([x0, y0, x1, y1], radius=12, fill=WHITE + (int(235 * a2),),
                            outline=col + (int(170 * a2),), width=2)
        tracked(d, (x0 + 24, y0 + 22), name, font("mono_b", 22), col + (int(255 * a2),), 2.6)
        d.text((x0 + 24, y0 + 58), sub, font=font("regular", 22), fill=INK + (int(255 * a2),))
        d.line([(cx + 118, cy), (x0 - 8, (y0 + y1) // 2)], fill=FOREST + (int(110 * a2),), width=3)

    # scenarios
    a = appear(t, 0.9, 0.7)
    y = 720
    d.rounded_rectangle([M, y, W - M, y + 170], radius=12, fill=WHITE + (int(200 * a),),
                        outline=BORDER + (int(255 * a),), width=2)
    tracked(d, (M + 28, y + 22), "TWO CASES", font("mono_b", 16), MUTED + (int(255 * a),), 2.4)
    d.text((M + 28, y + 58), "wet + wet", font=font("mono_b", 30), fill=GREEN + (int(255 * a),))
    d.text((M + 250, y + 62), "→ record the field", font=font("regular", 26), fill=INK + (int(255 * a),))
    d.text((M + 28, y + 108), "wet + dry", font=font("mono_b", 30), fill=AMBER + (int(255 * a),))
    d.text((M + 250, y + 112), "→ flag for a human, never average", font=font("regular", 26),
           fill=INK + (int(255 * a),))
    return im


# ------------------------------------------------------------------ 9 honesty
def honesty_card(stage, t, dur):
    im = _shell("STATUS · 8 NOV 2026", "09 · STATUS")
    _title(im, "Where we honestly are.", 170, 70)
    d = ImageDraw.Draw(im, "RGBA")

    cols = [
        (M, "BUILT", GREEN, [
            "Gateway prototype",
            "Dashboard",
            "Probe Explorer",
            "SAR model (trained)",
        ]),
        (M + 894, "IN BUILD", AMBER, [
            "Probe (printing)",
            "Field nodes",
            "Soil calibration",
        ]),
    ]
    for ci, (x, head, col, items) in enumerate(cols):
        a = appear(t, 0.15 + ci * 0.12, 0.6)
        d.rounded_rectangle([x, 290, x + 830, 690], radius=14, fill=WHITE + (int(220 * a),),
                            outline=BORDER + (int(255 * a),), width=2)
        tracked(d, (x + 30, 314), head, font("mono_b", 20), col + (int(255 * a),), 3.0)
        for i, s in enumerate(items):
            aa = appear(t, 0.35 + i * 0.1 + ci * 0.08, 0.5)
            yy = 380 + i * 66
            if col == GREEN:
                check_icon(d, x + 32, yy, 22, GREEN + (int(255 * aa),), 3)
            else:
                arrow_icon(d, x + 32, yy - 2, 22, AMBER + (int(255 * aa),), 3)
            d.text((x + 76, yy - 8), s, font=font("regular", 29), fill=INK + (int(255 * aa),))
        if ci == 1:
            d.text((x + 30, 600), "These three finish before the pilot starts.", font=font("regular", 21),
                   fill=MUTED + (int(255 * a),))
            d.text((x + 30, 630), "The gateway, dashboard and explorer already run today.", font=font("regular", 21),
                   fill=MUTED + (int(255 * a),))

    a = appear(t, 0.7, 0.7)
    d.text((M, 724), "Probe readings in this film are simulated. Thresholds are illustrative",
           font=font("regular", 21), fill=MUTED + (int(255 * a),))
    d.text((M, 754), "until we calibrate in real soil.", font=font("regular", 21), fill=MUTED + (int(255 * a),))

    if stage >= 2:
        a = appear(t, 0.2, 0.7)
        d.rounded_rectangle([M, 812, W - M, 892], radius=12, fill=(255, 248, 232, int(235 * a)),
                            outline=AMBER + (int(220 * a),), width=2)
        tracked(d, (M + 28, 830), "NEXT", font("mono_b", 18), AMBER + (int(255 * a),), 3.0)
        d.text((M + 120, 822), "7-day field pilot + soil calibration.", font=font("semibold", 31),
               fill=FOREST + (int(255 * a),))
    return im


# ------------------------------------------------------------------ 10 IPCC
def ipcc_card(t, dur):
    im = _shell("WHY IT MATTERS · IPCC DEFAULTS", "10 · IMPACT",
                "IPCC DEFAULT EMISSION FACTORS · ONE HECTARE · ONE SEASON", "ILLUSTRATIVE")
    _title(im, "One hectare. One season.", 168, 66)
    d = ImageDraw.Draw(im, "RGBA")
    d.text((M, 270), "Kilograms of methane, as cited in the script.", font=font("regular", 26), fill=MUTED)

    rows = [
        ("CONTINUOUS FLOODING", 140, 1.0, RED, "the baseline we are replacing"),
        ("ALTERNATE WETTING + DRYING", 80, 80 / 140, GREEN, "the practice the probe verifies"),
    ]
    for i, (label, v, frac, col, sub) in enumerate(rows):
        y = 390 + i * 190
        a = appear(t, 0.2 + i * 0.25, 0.7)
        tracked(d, (M, y), label, font("mono_b", 19), col + (int(255 * a),), 2.8)
        d.text((M, y + 40), count(t, 0.3 + i * 0.25, 1.2, v, "{:.0f}"),
               font=font("mono_b", 72), fill=INK + (int(255 * a),))
        d.text((M + 150, y + 74), "kg CH4", font=font("regular", 23), fill=MUTED + (int(255 * a),))
        d.text((M, y + 116), sub, font=font("regular", 20), fill=MUTED + (int(255 * a),))
        bar(d, 700, y + 34, 900, 26, frac * ease_out((t - 0.35 - i * 0.25) / 1.1), col + (int(240 * a),))

    a = appear(t, 0.9, 0.7)
    d.rounded_rectangle([M, 770, 1080, 870], radius=12, fill=WHITE + (int(210 * a),),
                        outline=BORDER + (int(255 * a),), width=2)
    d.text((M + 26, 790), "Difference", font=font("mono_b", 16), fill=MUTED + (int(255 * a),))
    d.text((M + 26, 814), "\u2248 43 % less methane", font=font("semibold", 34), fill=GREEN + (int(255 * a),))
    d.text((1140, 800), "Defaults, not a promise. Soil, season and water", font=font("regular", 19),
           fill=MUTED + (int(200 * a),))
    d.text((1140, 828), "management decide the real number.", font=font("regular", 19),
           fill=MUTED + (int(200 * a),))
    return im


# ------------------------------------------------------------------ 11 cost
def cost_card(t, dur):
    im = _shell("PROTOTYPE BOM · JULY 2026", "10 · IMPACT",
                "ROUND 1 DECK · SLIDE 14 · JULY 2026 BOM · V2 NOT COSTED")
    d = ImageDraw.Draw(im, "RGBA")
    tracked(d, (M, 162), "THE JULY PROTOTYPE", font("mono_b", 18), GREEN, 3.0)
    d.text((M, 192), "\u20b9" + count(t, 0.10, 1.1, 14995, "{:,.0f}"),
           font=font("black", 138), fill=FOREST)
    d.text((M, 354), "for three field nodes and one gateway.", font=font("medium", 29), fill=INK)
    d.text((M, 398), "The V2 station is designed but not costed yet.", font=font("regular", 21), fill=MUTED)

    segs = [
        ("Heltec boards x4", 8800, GREEN),
        ("Power: cells, shields, solar", 2950, WATER),
        ("Sensors: ultrasonic, DS18B20, soil", 1545, AMBER),
        ("Enclosures x4", 800, FOREST),
        ("Antennas", 600, SOFT),
        ("Cables + misc", 300, GREY),
    ]
    total = sum(v for _, v, _ in segs)
    x, y, bw, bh = M, 482, W - 2 * M, 48
    draw = ease_out((t - 0.25) / 1.15)
    acc = 0
    for label, v, col in segs:
        sw = bw * v / total
        x0 = x + bw * acc / total
        x1 = x0 + sw * clamp((draw * bw - bw * acc / total) / max(sw, 0.001))
        if x1 > x0:
            d.rectangle([x0, y, x1, y + bh], fill=col)
        acc += v

    for i, (label, v, col) in enumerate(segs):
        cx = M + (i % 3) * 580
        cy = 574 + (i // 3) * 104
        a = appear(t, 0.45 + i * 0.06, 0.45)
        d.rectangle([cx, cy + 4, cx + 14, cy + 18], fill=col + (int(255 * a),))
        tracked(d, (cx + 26, cy), label.upper(), font("mono_b", 14), INK + (int(255 * a),), 1.2)
        d.text((cx + 26, cy + 28), "\u20b9{:,}".format(v), font=font("mono_b", 22), fill=INK + (int(255 * a),))

    a = appear(t, 0.9, 0.5)
    d.line([(M, 806), (W - M, 806)], fill=BORDER, width=2)
    d.text((M, 822), "Total, within the \u20b915K July target", font=font("medium", 20), fill=MUTED + (int(255 * a),))
    d.text((W - M - 150, 814), "\u20b914,995", font=font("mono_b", 30), fill=GREEN + (int(255 * a),))
    return im


def doc_card(kicker, title, image_path, bullets, note, source, t, dur):
    im = _shell(kicker, "05 · HARDWARE", source)
    _title(im, title, 168, 58, max_w=1500)
    d = ImageDraw.Draw(im, "RGBA")

    img = contain(Image.open(image_path), 800, 720)
    a = appear(t, 0.10, 0.55)
    if a > 0:
        px, py = M, int(280 + 18 * (1 - a))
        im.paste(img, (px, py))
        d.rectangle([px, py, px + img.width - 1, py + img.height - 1], outline=(22, 35, 29, int(110 * a)), width=2)
        tracked(d, (px, py - 28), "SOURCE DOCUMENT", font("mono_b", 13), GREY + (int(220 * a),), 2.0)

    x = 1030
    for i, (head, body) in enumerate(bullets):
        aa = appear(t, 0.28 + i * 0.09, 0.45)
        yy = 300 + i * 118
        d.rectangle([x, yy + 4, x + 4, yy + 84], fill=GREEN + (int(255 * aa),))
        tracked(d, (x + 22, yy), head.upper(), font("mono_b", 17), GREEN + (int(255 * aa),), 2.2)
        for j, line in enumerate(wrap(d, body, font("regular", 21), 700)):
            d.text((x + 22, yy + 28 + j * 29), line, font=font("regular", 21), fill=INK + (int(255 * aa),))

    a = appear(t, 0.7, 0.5)
    d.text((x, 760), note, font=font("regular", 20), fill=MUTED + (int(255 * a),))
    return im


def face_card(take, line, note, t, dur):
    total = 3
    im = dark_base(FOREST_2)
    d = ImageDraw.Draw(im, "RGBA")
    # dashed frame
    for x in range(80, W - 80, 40):
        d.line([(x, 80), (x + 18, 80)], fill=(120, 150, 135, 150), width=3)
        d.line([(x, H - 80), (x + 18, H - 80)], fill=(120, 150, 135, 150), width=3)
    for y in range(80, H - 80, 40):
        d.line([(80, y), (80, y + 18)], fill=(120, 150, 135, 150), width=3)
        d.line([(W - 80, y), (W - 80, y + 18)], fill=(120, 150, 135, 150), width=3)

    # head + shoulders, thin
    d.ellipse([430, 232, 690, 492], outline=(120, 150, 135, 170), width=4)
    d.arc([320, 470, 800, 930], 200, 340, fill=(120, 150, 135, 170), width=4)
    # crosshair
    d.line([(560, 180), (560, 232)], fill=(120, 150, 135, 120), width=2)
    d.line([(560, 492), (560, 560)], fill=(120, 150, 135, 120), width=2)

    tracked(d, (104, 104), "FACE CAM · TAKE %d / %d" % (take, total), font("mono_b", 20),
            ACCENT, 3.2)
    rec_dot(im, W - 104 - tracked_width(d, "PLACEHOLDER", font("mono_b", 17), 2.4) - 30, 104, t)
    tracked(d, (W - 104 - tracked_width(d, "PLACEHOLDER", font("mono_b", 17), 2.4), 104),
            "PLACEHOLDER", font("mono_b", 17), (220, 120, 105), 2.4)

    d.text((1050, 360), "TAKE %d" % take, font=font("black", 96), fill=WHITE)
    d.text((1054, 470), note, font=font("medium", 30), fill=ACCENT)
    # the line to read
    tracked(d, (1054, 552), "LINE", font("mono_b", 15), (150, 170, 158), 2.4)
    for j, ln in enumerate(wrap(d, line, font("regular", 30), 720)):
        d.text((1054, 590 + j * 42), ln, font=font("regular", 30), fill=(236, 241, 234))
    tracked(d, (1054, 900), "1080p · 24 FPS · EYE LEVEL · QUIET ROOM", font("mono", 15),
            (160, 180, 168), 1.8)
    tracked(d, (104, H - 146), "NOT A RECORDED TAKE", font("mono_b", 16), (200, 120, 105), 2.6)
    return im


# ------------------------------------------------------------------ 13 end
def end_card(t, dur):
    im = dark_base(FOREST)
    d = ImageDraw.Draw(im, "RGBA")
    # faint field lines
    for i in range(14):
        y = 120 + i * 70
        d.arc([-600, y - 120, 1500, y + 340], 200, 340, fill=(30, 80, 60, 90), width=2)

    a = appear(t, 0.05, 0.6)
    tracked(d, (M, 176), "TEAM FUSIONFORGE · ROUND 2", font("mono_b", 19), ACCENT + (int(255 * a),), 3.2)
    d.text((M - 4, 222), "AGRI-GRID", font=font("black", 112), fill=WHITE + (int(255 * a),))
    d.text((M, 372), "Ground truth for rice.", font=font("medium", 42), fill=(220, 232, 222, int(255 * a)))

    a2 = appear(t, 0.3, 0.6)
    d.text((M, 520), "Live site", font=font("mono_b", 16), fill=(150, 180, 162, int(255 * a2)))
    d.text((M, 548), "agri-grid-chi.vercel.app", font=font("medium", 44), fill=WHITE + (int(255 * a2),))
    d.text((M, 640), "Code", font=font("mono_b", 16), fill=(150, 180, 162, int(255 * a2)))
    d.text((M, 668), "github.com/Neeraj-Parekh/AGRI-GRID", font=font("regular", 24),
           fill=(220, 232, 222, int(255 * a2)))

    # QR
    global _qr
    if _qr is None:
        qr = qrcode.QRCode(box_size=8, border=0, error_correction=qrcode.constants.ERROR_CORRECT_M)
        qr.add_data("https://agri-grid-chi.vercel.app")
        qr.make(fit=True)
        _qr = qr.make_image(fill_color=(7, 59, 42), back_color=(255, 255, 255)).convert("RGB")
    a3 = appear(t, 0.45, 0.65)
    qs = 300
    q = _qr.resize((qs, qs), Image.NEAREST)
    qx, qy = W - M - qs - 18, 300
    d.rounded_rectangle([qx - 24, qy - 24, qx + qs + 24, qy + qs + 24], radius=16,
                        fill=WHITE + (int(255 * a3),))
    im.paste(q, (qx, qy))
    tracked(d, (qx - 10, qy + qs + 42), "SCAN TO OPEN", font("mono_b", 15), ACCENT + (int(220 * a3),), 2.4)

    a4 = appear(t, 0.7, 0.7)
    d.line([(M, 846), (W - M, 846)], fill=(60, 100, 82, int(220 * a4)), width=2)
    d.text((M, 872), "Neeraj Parekh · Team FusionForge", font=font("medium", 26), fill=WHITE + (int(255 * a4),))
    d.text((M, 910), "Mentor: Trupti Bhalerao · MIT Academy of Engineering, Pune",
           font=font("regular", 20), fill=(180, 200, 188, int(255 * a4)))
    tracked(d, (W - M - tracked_width(d, "THANK YOU", font("mono_b", 18), 3.0), 880),
            "THANK YOU", font("mono_b", 18), ACCENT + (int(255 * a4),), 3.0)
    return im
