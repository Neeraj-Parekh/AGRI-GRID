#!/usr/bin/env python3
"""Shared visual system for the AGRI-GRID Round 2 film.

The palette is lifted from the live product (`frontend/src/theme.css`) so the video,
the dashboard and the deck read as one brand. Cards are paper, photographs are
full-bleed, and every number is set in mono so it reads as field data rather than
marketing copy.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageOps, ImageFilter
import math

W, H, FPS = 1920, 1080, 24

# ------------------------------------------------------------------ palette
PAPER      = (245, 246, 241)
PAPER_2    = (237, 238, 230)
WHITE      = (255, 255, 255)
INK        = (22, 35, 29)
FOREST     = (7, 59, 42)
FOREST_2   = (11, 46, 34)
GREEN      = (47, 125, 70)
ACCENT     = (121, 201, 91)
WATER      = (45, 120, 183)
SOFT       = (111, 182, 217)
AMBER      = (217, 154, 37)
RED        = (201, 77, 61)
MUTED      = (101, 113, 107)
BORDER     = (222, 226, 216)
GREY       = (140, 150, 143)

# Accents used for beats. Photos keep a neutral grade; cards get one accent each.
C = {
    "green": GREEN,
    "accent": ACCENT,
    "water": WATER,
    "soft": SOFT,
    "amber": AMBER,
    "red": RED,
    "forest": FOREST,
    "ink": INK,
}

# ------------------------------------------------------------------ type
_FONT_DIR = Path("/home/neeraj-parekh/.local/share/fonts/nyx-inter")
_FILES = {
    "regular":  _FONT_DIR / "Inter-Regular.ttf",
    "medium":   _FONT_DIR / "Inter-Medium.ttf",
    "semibold": _FONT_DIR / "Inter-SemiBold.ttf",
    "bold":     _FONT_DIR / "Inter-Bold.ttf",
    "black":    _FONT_DIR / "Inter-Black.ttf",
    "mono":     Path("/usr/share/fonts/truetype/noto/NotoSansMono-Regular.ttf"),
    "mono_b":   Path("/usr/share/fonts/truetype/noto/NotoSansMono-Bold.ttf"),
    "deva":     Path("/usr/share/fonts/truetype/noto/NotoSansDevanagari-Regular.ttf"),
    "deva_b":   Path("/usr/share/fonts/truetype/noto/NotoSansDevanagari-Bold.ttf"),
}
_cache = {}


def font(weight="regular", size=32):
    key = (weight, size)
    if key not in _cache:
        _cache[key] = ImageFont.truetype(str(_FILES[weight]), size)
    return _cache[key]


def tw(d, s, f):
    b = d.textbbox((0, 0), s, font=f)
    return b[2] - b[0]


def tracked(d, xy, s, f, fill, tracking=0.0, anchor="lt"):
    """Draw text with letter-spacing. tracking is in pixels."""
    x, y = xy
    if tracking == 0:
        d.text((x, y), s, font=f, fill=fill, anchor=anchor)
        return x + tw(d, s, f)
    for ch in s:
        d.text((x, y), ch, font=f, fill=fill, anchor=anchor)
        x += f.getlength(ch) + tracking
    return x - tracking


def tracked_width(d, s, f, tracking=0.0):
    if not s:
        return 0
    return sum(f.getlength(ch) for ch in s) + tracking * (len(s) - 1)


def wrap(d, s, f, width):
    words = s.split()
    if not words:
        return [""]
    lines, cur = [], words[0]
    for w in words[1:]:
        test = cur + " " + w
        if tw(d, test, f) <= width:
            cur = test
        else:
            lines.append(cur)
            cur = w
    lines.append(cur)
    return lines


def money(s):
    return s


# ------------------------------------------------------------------ easing
def clamp(v, lo=0.0, hi=1.0):
    return max(lo, min(hi, v))


def ease_out(t):
    t = clamp(t)
    return 1 - (1 - t) ** 3


def ease_in_out(t):
    t = clamp(t)
    return 4 * t ** 3 if t < 0.5 else 1 - (-2 * t + 2) ** 3 / 2


def ease_out_back(t):
    t = clamp(t)
    c = 1.70158
    return 1 + (c + 1) * (t - 1) ** 3 + c * (t - 1) ** 2


def lerp(a, b, t):
    return a + (b - a) * t


def appear(t, start, dur=0.55):
    """0..1 entrance value with a short ease."""
    return ease_out((t - start) / dur) if dur > 0 else 1.0


# ------------------------------------------------------------------ geometry
def cover(im, w=W, h=H):
    return ImageOps.fit(im.convert("RGB"), (w, h), Image.LANCZOS)


def contain(im, w, h):
    im = im.convert("RGB")
    im.thumbnail((w, h), Image.LANCZOS)
    return im


def rounded(im, radius=18):
    mask = Image.new("L", im.size, 0)
    d = ImageDraw.Draw(mask)
    d.rounded_rectangle([0, 0, im.width - 1, im.height - 1], radius=radius, fill=255)
    out = im.convert("RGBA")
    out.putalpha(mask)
    return out


def shadow(im, blur=26, offset=(0, 14), opacity=70):
    pad = blur * 3
    canvas = Image.new("RGBA", (im.width + pad * 2, im.height + pad * 2), (0, 0, 0, 0))
    sil = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    alpha = im.getchannel("A") if im.mode == "RGBA" else Image.new("L", im.size, 255)
    sil.paste((0, 0, 0, opacity), (pad + offset[0], pad + offset[1]), alpha)
    sil = sil.filter(ImageFilter.GaussianBlur(blur))
    canvas = Image.alpha_composite(canvas, sil)
    canvas.paste(im, (pad, pad), im if im.mode == "RGBA" else None)
    return canvas


# ------------------------------------------------------------------ texture
_noise = None
_vignette = None


def paper_grain(size=(W, H), strength=7):
    global _noise
    if _noise is None or _noise.size != size:
        n = Image.effect_noise(size, 18).convert("L")
        _noise = n
    n = _noise
    layer = Image.new("RGB", size, (128, 128, 128))
    return layer, n, strength


def add_paper_grain(im, strength=0.035):
    """Blend a faint static grain, then a warm paper wash."""
    n = Image.effect_noise(im.size, 26).convert("L")
    grain = Image.merge("RGB", (n, n, n))
    return Image.blend(im.convert("RGB"), grain, strength)


def vignette(im, strength=0.16):
    global _vignette
    if _vignette is None or _vignette.size != im.size:
        w, h = im.size
        mask = Image.new("L", (w, h), 0)
        d = ImageDraw.Draw(mask)
        # concentric ellipses, cheap radial falloff
        steps = 60
        for i in range(steps):
            a = int(255 * (i / steps) ** 2.2)
            d.ellipse([-w * 0.25 + w * 0.75 * i / steps,
                       -h * 0.25 + h * 0.75 * i / steps,
                       w * 1.25 - w * 0.75 * i / steps,
                       h * 1.25 - h * 0.75 * i / steps],
                      fill=255 - a)
        _vignette = mask.filter(ImageFilter.GaussianBlur(120))
    dark = Image.new("RGB", im.size, FOREST_2)
    return Image.composite(im, dark, _vignette.point(lambda v: 255 - int(v * strength)))


def grade(im, warm=1.02, desat=0.06, lift=4):
    """Gentle documentary grade: slight desaturation, warm highlights, lifted blacks."""
    im = im.convert("RGB")
    if desat:
        g = ImageOps.grayscale(im)
        im = Image.blend(im, Image.merge("RGB", (g, g, g)), desat)
    r, g, b = im.split()
    r = r.point(lambda v: min(255, int(v * warm) + lift))
    b = b.point(lambda v: max(0, int(v * (2 - warm)) + lift // 2))
    return Image.merge("RGB", (r, g, b))


# ------------------------------------------------------------------ chrome
def rule(d, x0, y, x1, fill=BORDER, width=2):
    d.line([(x0, y), (x1, y)], fill=fill, width=width)


def kicker(d, x, y, s, color=GREEN, size=20, tracking=3.2):
    return tracked(d, (x, y), s.upper(), font("mono_b", size), color, tracking)


def big_number(im, x, y, s, color=INK, size=210, weight="black"):
    d = ImageDraw.Draw(im)
    d.text((x, y), s, font=font(weight, size), fill=color)
    return im


def pill(d, x, y, s, fg, bg=None, border=None, padx=16, pady=8, size=18, tracking=1.2):
    f = font("mono_b", size)
    w = tracked_width(d, s, f, tracking)
    h = size + pady * 2
    bg = bg or (255, 255, 255)
    border = border or fg
    d.rounded_rectangle([x, y, x + w + padx * 2, y + h], radius=h // 2,
                        fill=bg, outline=border, width=2)
    tracked(d, (x + padx, y + pady - 1), s, f, fg, tracking)
    return w + padx * 2


def check_icon(d, x, y, s=24, color=GREEN, width=4):
    d.line([(x, y + s * 0.55), (x + s * 0.36, y + s * 0.88)], fill=color, width=width)
    d.line([(x + s * 0.36, y + s * 0.88), (x + s, y + s * 0.08)], fill=color, width=width)


def arrow_icon(d, x, y, s=24, color=AMBER, width=4):
    d.line([(x, y + s / 2), (x + s, y + s / 2)], fill=color, width=width)
    d.line([(x + s * 0.62, y + s * 0.18), (x + s, y + s / 2)], fill=color, width=width)
    d.line([(x + s * 0.62, y + s * 0.82), (x + s, y + s / 2)], fill=color, width=width)


def dot_grid(im, step=48, color=(0, 0, 0), alpha=10):
    layer = Image.new("RGBA", im.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    for yy in range(step, im.height, step):
        for xx in range(step, im.width, step):
            d.ellipse([xx, yy, xx + 2, yy + 2], fill=color + (alpha,))
    return Image.alpha_composite(im.convert("RGBA"), layer).convert("RGB")


def paper_base(tint=PAPER):
    im = Image.new("RGB", (W, H), tint)
    return add_paper_grain(im, 0.06)


def dark_base(tint=FOREST):
    im = Image.new("RGB", (W, H), tint)
    return add_paper_grain(im, 0.05)


# ------------------------------------------------------------------ photo overlays
def progress_bar_layer(t, total):
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer, "RGBA")
    d.rectangle([0, H - 4, W, H], fill=(0, 0, 0, 90))
    d.rectangle([0, H - 4, int(W * clamp(t / total)), H], fill=ACCENT + (255,))
    return layer


def progress_bar(im, t, total):
    return Image.alpha_composite(im.convert("RGBA"), progress_bar_layer(t, total)).convert("RGB")


def photo_chrome_layer(t, total, chapter, screen=False, watermark=True):
    """Top chrome as a transparent layer so it never pans with the photograph."""
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer, "RGBA")
    if not screen:
        for i in range(210):
            d.rectangle([0, i, W, i + 1], fill=(4, 18, 13, int(135 * (1 - i / 210) ** 1.5)))
        tracked(d, (64, 44), "AGRI-GRID", font("mono_b", 18), (255, 255, 255, 205), 4.0)
        tracked(d, (64, 72), chapter.upper(), font("mono", 15), (255, 255, 255, 135), 2.6)
        if watermark:
            tracked(d, (W - 64 - tracked_width(d, "ANIMATIC · V2", font("mono", 14), 2.4), 48),
                    "ANIMATIC · V2", font("mono", 14), (255, 255, 255, 115), 2.4)
    return layer


def photo_chrome(im, t, total, chapter, screen=False, watermark=True):
    layer = photo_chrome_layer(t, total, chapter, screen, watermark)
    return Image.alpha_composite(im.convert("RGBA"), layer).convert("RGB")


def lower_third_layer(vo, t, accent=ACCENT, sub=None, paper=False, source=None,
                      band_label=None):
    """The recording strip as a transparent layer."""
    band_h = 170 if vo else 112
    y0 = H - band_h
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer, "RGBA")
    if paper:
        fill = PAPER + (255,)
        label_col = GREEN
        stamp_col = MUTED
        text_col = INK
        sub_col = MUTED
        hold_col = GREY
    else:
        fill = (5, 24, 18, 255)
        label_col = accent
        stamp_col = (176, 190, 181)
        text_col = (255, 255, 255)
        sub_col = (178, 192, 183)
        hold_col = (150, 166, 156)
    d.rectangle([0, y0, W, H], fill=fill)
    d.rectangle([0, y0, W, y0 + 3], fill=accent)

    stamp = "%s  /  %s" % (tc(t), beat_name(t))
    tracked(d, (56, y0 + 20), stamp, font("mono_b", 16), label_col, 2.0)

    if source:
        f = font("mono", 13)
        w = tracked_width(d, source.upper(), f, 1.5)
        tracked(d, (W - 56 - w, y0 + 22), source.upper(), f, stamp_col, 1.5)

    if vo:
        f = font("deva", 28) if any("\u0900" <= ch <= "\u097f" for ch in vo) else font("regular", 28)
        lines = wrap(d, vo, f, 1540)
        if len(lines) > 3:
            f = font("regular", 25)
            lines = wrap(d, vo, f, 1660)
        yy = y0 + 52
        for line in lines[:3]:
            d.text((56, yy), line, font=f, fill=text_col)
            yy += 38
        if sub:
            d.text((56, yy + 1), sub, font=font("regular", 20), fill=sub_col)
    else:
        tracked(d, (56, y0 + 58), "[ VISUAL HOLD · NO LINE ]", font("mono", 17), hold_col, 2.4)
    return layer


def lower_third(im, vo, t, accent=ACCENT, sub=None, paper=False, source=None):
    layer = lower_third_layer(vo, t, accent, sub, paper, source)
    return Image.alpha_composite(im.convert("RGBA"), layer).convert("RGB")


def caption_layer(text, accent=ACCENT, y=None, paper=False, max_w=1500):
    """A compact line for cards that carry their own layout (title, end, face)."""
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer, "RGBA")
    f = font("regular", 27)
    lines = wrap(d, text, f, max_w)
    if len(lines) > 2:
        f = font("regular", 24)
        lines = wrap(d, text, f, max_w)
    lh = 34
    h = len(lines) * lh + 20
    if y is None:
        y = H - 72 - h
    wmax = max(tw(d, line, f) for line in lines) + 64
    x = 64
    fill = PAPER + (246,) if paper else (5, 24, 18, 238)
    fg = INK if paper else (255, 255, 255)
    d.rounded_rectangle([x, y, x + wmax, y + h], radius=8, fill=fill)
    d.rectangle([x, y, x + 5, y + h], fill=accent)
    yy = y + 10
    for line in lines:
        d.text((x + 26, yy), line, font=f, fill=fg)
        yy += lh
    return layer


def beat_name(t):
    for end, name in [(25, "01 · HOOK"), (75, "02 · THE PROBLEM"), (105, "03 · THE IDEA"),
                      (195, "04 · THE PROBE"), (230, "05 · HARDWARE"), (280, "06 · THE GRID"),
                      (340, "07 · THE AI"), (380, "08 · THE DASHBOARD"), (405, "09 · STATUS"),
                      (440, "10 · IMPACT"), (456, "11 · CLOSE")]:
        if t < end:
            return name
    return "11 · CLOSE"


def tc(t):
    return "%d:%02d" % (int(t) // 60, int(t) % 60)


def chapter_name(t):
    return beat_name(t).split("·", 1)[1].strip().title()
