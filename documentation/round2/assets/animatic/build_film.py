#!/usr/bin/env python3
"""Build the v2 7:35 AGRI-GRID Round 2 animatic.

Same 455-second timeline and the same voice-over cues as `build_animatic.py`.
What changes is the look: the cards are rebuilt on the product palette, the
photographs get a documentary grade and a slow pan, the chrome is drawn as a
static layer so it never drifts with the picture, and every act boundary is a
dip cut to black.

Run:

    /mnt/20265E15265DEC72/study/CODE/linux_venv/bin/python build_film.py

Output is silent, 1920x1080, 24 fps, H.264. Intermediates live in
`/tmp/opencode/film/v2`; the MP4 is copied next to this script.
"""
from pathlib import Path
from PIL import Image, ImageDraw
import subprocess
import shutil
import sys
import time

import film_style as fs
import film_cards as fc

ROOT = Path("/mnt/20265E15265DEC72/study/CODE/HACKATHON/temp")
A = ROOT / "documentation/round2/assets"
HERE = A / "animatic"
BUILD = Path("/tmp/opencode/film/v2")
SEG = BUILD / "segments"
GRADE = BUILD / "graded"
OV = BUILD / "overlays"
HOLD = BUILD / "holds"
PARTS = BUILD / "parts"
for d in (SEG, GRADE, OV, HOLD, PARTS, HERE):
    d.mkdir(parents=True, exist_ok=True)

W, H, FPS = fs.W, fs.H, fs.FPS
TOTAL = 455.0
ANIM = 1.8                      # seconds of card animation, then a held frame
CRF = "20"
PRESET = "veryfast"

# act boundaries: a 3-frame dip to black on each side
BOUND = {25, 75, 105, 195, 230, 280, 340, 380, 405, 440}

QC = "/mnt/20265E15265DEC72/study/CODE/linux_venv/bin/python"


# ------------------------------------------------------------------ segments
def S(a, b, kind, label, accent, src=None, vo=None, sub=None, source=None,
      render=None, band=False, paper=True, caption=None, caption_y=None,
      ss=0.0, screen=False, note=None, fit=False):
    return dict(a=a, b=b, kind=kind, label=label, accent=accent, src=str(src) if src else None,
                vo=vo, sub=sub, source=source, render=render, band=band, paper=paper,
                caption=caption, caption_y=caption_y, ss=ss, screen=screen, note=note,
                fit=fit)


def card(a, b, label, accent, render, vo=None, sub=None, source=None, paper=True,
         caption=False, caption_y=None, band=None):
    if band is None:
        band = bool(vo) and not caption
    return S(a, b, "card", label, accent, vo=vo, sub=sub, source=source, render=render,
             band=band, paper=paper, caption=caption, caption_y=caption_y)


def build_sheet_page():
    """Rasterise page 1 of the real build-sheet PDF for the document card."""
    pdf = A / "prototype-circuits/AGRI_GRID_Prototype_Build_Sheet.pdf"
    out = BUILD / "cards" / "build-sheet"
    out.parent.mkdir(parents=True, exist_ok=True)
    pages = sorted(out.parent.glob("build-sheet-*.png"))
    if not pages:
        subprocess.run(["pdftoppm", "-png", "-r", "150", "-f", "1", "-l", "1",
                        str(pdf), str(out)], check=True)
        pages = sorted(out.parent.glob("build-sheet-*.png"))
    return pages[0]


def build_segments():
    P = A / "probe-stills"
    R1 = A / "round1-deck/slides"
    DV = A / "deck-visuals"
    HW = A / "hardware"
    DB = A / "dashboard"
    SAR = A / "sar"
    B = A / "prototype-circuits"

    face1 = "The problem is, it happens fifteen centimetres underground, where nobody can see."
    face2 = "This is what's on our bench today."
    face3 = ("The decision happens fifteen centimetres underground. AGRI-GRID sees it, "
             "tells the farmer, and proves it.")

    segs = []

    # ---------------------------------------------------------------- beat 1
    segs += [
        S(0, 7, "screen", "PROBE EXPLORER · ch1 · flooded paddy", fs.GREEN,
          P / "probe-ch01-flooded.jpg", source="PROBE EXPLORER · CH 01",
          vo="India's rice paddies release about six and a half million tonnes of methane every year."),
        S(7, 15, "screen", "PROBE EXPLORER · ch1 · water starts to drop", fs.GREEN,
          P / "probe-ch01-flooded.jpg", source="PROBE EXPLORER · CH 01",
          vo="Most of it comes from one habit: keeping fields flooded all season. The fix is already known."),
        card(15, 21, "FACE CAM · TAKE 1 · HOOK", fs.RED,
             lambda t, d: fc.face_card(1, face1, "HOOK · 0:15-0:21", t, d),
             vo=face1, band=False),
        card(21, 25, "TITLE CARD", fs.GREEN,
             lambda t, d: fc.title_card(t, d),
             vo="I'm Neeraj, and this is AGRI-GRID.",
             caption=True, caption_y=798),
    ]

    # ---------------------------------------------------------------- beat 2
    segs += [
        S(25, 38, "screen", "PROBE EXPLORER · ch1 · time-lapse", fs.GREEN,
          P / "probe-ch01-flooded.jpg", source="PROBE EXPLORER · CH 01",
          vo=("Flooded soil has no oxygen, so microbes in it make methane. IRRI's answer is "
              "alternate wetting and drying, AWD: let the water drop below the surface, then flood again.")),
        card(38, 50, "CARD · AWD NUMBERS", fs.AMBER,
             lambda t, d: fc.stats_card(t, d),
             vo=("It saves up to thirty percent of the water, and cuts methane by up to "
                 "forty-eight percent. India grows rice on about fifty-one million hectares, so this matters."),
             source="IRRI AWD · DA&FW 2024-25"),
        S(50, 57, "screen", "PROBE EXPLORER · ch1 · the −15 cm rule", fs.GREEN,
          P / "probe-ch01-rule.jpg", source="PROBE EXPLORER · CH 01",
          vo="But AWD has one rule: re-irrigate when the water is fifteen centimetres below the soil."),
        card(57, 75, "CARD · THE THREE GAPS", fs.AMBER,
             lambda t, d: fc.gaps_card(t, d),
             vo=("Today a farmer checks that by hand, with a pipe, in one spot, if he has time. "
                 "Nobody buying carbon credits can verify it was done. And satellites help, "
                 "but radar only sees the top five centimetres."),
             source="ROUND 1 DECK · PROBLEM STATEMENT"),
    ]

    # ---------------------------------------------------------------- beat 3
    segs += [
        card(75, 78, "CARD · THREE LAYERS", fs.AMBER,
             lambda t, d: fc.system_card(0, t, d),
             vo="So AGRI-GRID connects three layers."),
        card(78, 83, "CARD · GROUND", fs.GREEN,
             lambda t, d: fc.system_card(1, t, d),
             vo="Ground: a probe that reads water at four depths."),
        card(83, 88, "CARD · SPACE", fs.WATER,
             lambda t, d: fc.system_card(2, t, d),
             vo="Space: Sentinel-1 radar over the whole farm."),
        card(88, 98, "CARD · AI", fs.AMBER,
             lambda t, d: fc.system_card(3, t, d),
             vo=("And AI that turns both into one decision for the farmer, and one record "
                 "anyone can check.")),
        S(98, 105, "screen", "PROBE EXPLORER · ch2 · probe top-down", fs.GREEN,
          P / "probe-ch02-xray.jpg", source="PROBE EXPLORER · CH 02",
          vo="Let me show you each piece, starting underground."),
    ]

    # ---------------------------------------------------------------- beat 4
    beat4 = [
        (105, 115, "ch02-names.jpg", "PROBE EXPLORER · ch2 · names and scale", "CH 02",
         "This is the probe. A twenty-five millimetre tube, 3D-printed in PETG. White above the soil, black below."),
        (115, 124, "ch02-xray.jpg", "PROBE EXPLORER · ch2 · X-ray bands", "CH 02",
         "Inside, four copper bands sit at zero to five, five to ten, ten to fifteen and fifteen to twenty centimetres."),
        (124, 128, "ch03-copper.jpg", "PROBE EXPLORER · ch3 · copper in pockets", "CH 03",
         "It prints in two halves."),
        (128, 133, "ch03-wiring.jpg", "PROBE EXPLORER · ch3 · halves close", "CH 03",
         "The copper goes into shallow pockets, and the halves seal with epoxy."),
        (133, 139, "ch04-wall.jpg", "PROBE EXPLORER · ch4 · 1.6 mm wall", "CH 04",
         "The plastic wall is the insulator. No metal touches the soil, so nothing corrodes,"),
        (139, 145, "ch04-resistive.jpg", "PROBE EXPLORER · ch4 · resistive sensor", "CH 04",
         "unlike the cheap two-prong sensors that rust in weeks."),
        (145, 152, "ch05-fringing.jpg", "PROBE EXPLORER · ch5 · fringing field", "CH 05",
         "Each band is a capacitor. Its electric field reaches through the wall into the soil."),
        (152, 167, "ch05-curve.jpg", "PROBE EXPLORER · ch5 · ε → θ curve", "CH 05",
         "Water has a permittivity of about eighty; dry soil, about four. So as soil gets wetter, "
         "capacitance rises, and the ESP32's touch pins measure it directly. A published equation, "
         "Topp 1980, turns that into water content."),
        (167, 173, "ch06-guards.jpg", "PROBE EXPLORER · ch6 · guard rings", "CH 06",
         "Guard rings make sure each band reads only its own slice of soil."),
        (173, 188, "ch08-drying.jpg", "PROBE EXPLORER · ch8 · one drying cycle", "CH 08",
         "Here is one drying cycle: about ten days in a few seconds. The water strip follows the flood down. "
         "Then the bands dry, top to bottom."),
        (188, 195, "ch08-irrigate.jpg", "PROBE EXPLORER · ch8 · IRRIGATE NOW", "CH 08",
         "At minus fifteen, the node flags: irrigate."),
    ]
    for a, b, fn, label, ch, vo in beat4:
        segs.append(S(a, b, "screen", label, fs.GREEN, P / ("probe-" + fn),
                      source="PROBE EXPLORER · " + ch, vo=vo))

    # ---------------------------------------------------------------- beat 5
    segs += [
        card(195, 198, "FACE CAM · TAKE 2 · BENCH", fs.RED,
             lambda t, d: fc.face_card(2, face2, "BENCH · 3:15-3:18", t, d),
             vo=face2, band=False),
        S(198, 201, "clip", "HARDWARE · gateway exterior", fs.AMBER,
          HW / "gateway-electronics-1080p.mp4", source="GATEWAY PROTOTYPE · 7 NOV 2026",
          vo="The gateway prototype: the box that sits at the farmhouse.", ss=0.0),
        S(201, 206, "clip", "HARDWARE · IOTPS-Mini + controller board", fs.AMBER,
          HW / "gateway-internals-closeup.mp4", source="GATEWAY PROTOTYPE · 7 NOV 2026",
          vo="Mains-powered, with the power module", ss=1.0),
        S(206, 210, "photo", "HARDWARE · internals · second angle", fs.AMBER,
          HW / "gateway-frame-30s.jpg", source="GATEWAY PROTOTYPE · 7 NOV 2026",
          vo="and the controller board inside."),
        S(210, 216, "clip", "HARDWARE · powered on · green LED", fs.AMBER,
          HW / "gateway-electronics-1080p.mp4", source="GATEWAY PROTOTYPE · 7 NOV 2026",
          vo="And here it is powered on.", ss=22.0),
        card(216, 221, "BUILD SHEET · PAGE 1", fs.AMBER,
             lambda t, d: fc.doc_card(
                 "BUILD SHEET · PAGE 1", "One page per board.",
                 str(build_sheet_page()),
                 [("PIN MAP", "Every header labelled with its GPIO and its job."),
                  ("POWER", "5 V rail, cell protection and a solar input."),
                  ("CONNECTORS", "Sensor, radio and service port, keyed.")],
                 "The same sheet the bench build follows.",
                 "PROTOTYPE BUILD SHEET · PAGE 1", t, d),
             vo="The probes and field nodes are being built to the design you just saw.",
             source="BUILD SHEET · PAGE 1"),
        card(221, 225, "CIRCUIT · SYSTEM DIAGRAM", fs.AMBER,
             lambda t, d: fc.doc_card(
                 "SYSTEM DIAGRAM", "Every wire has a label.",
                 str(B / "png/hero.png"),
                 [("SENSING", "Four bands, one ESP32 touch front-end."),
                  ("RADIO", "ESP-NOW to the gateway, no per-node SIM."),
                  ("POWER", "Protected 18650 pack with solar input.")],
                 "The node electronics follow the build sheet.",
                 "SYSTEM DIAGRAM · PROTOTYPE CIRCUITS", t, d),
             vo="The node electronics follow our build sheet.",
             source="SYSTEM DIAGRAM"),
        S(225, 230, "photo", "BENCH · ESP32 + radio wiring", fs.AMBER,
          HW / "esp32-bench-wiring-1.jpg", source="BENCH · 8 NOV 2026"),
    ]

    # ---------------------------------------------------------------- beat 6
    segs += [
        S(230, 242, "screen", "PROBE EXPLORER · ch9 · four nodes", fs.GREEN,
          P / "probe-ch09-leak.jpg", source="PROBE EXPLORER · CH 09",
          vo=("In the field, every node sends its readings to that gateway over ESP-NOW, "
              "the ESP32's own radio. No Wi-Fi network, and no SIM card on each node.")),
        S(242, 252, "screen", "PROBE EXPLORER · ch9 · B2 leaking bund", fs.GREEN,
          P / "probe-ch09-leak.jpg", source="PROBE EXPLORER · CH 09",
          vo=("Here, node B2 is losing water three times faster than its neighbours. "
              "That isn't normal drying. That's a leaking bund.")),
        S(252, 258, "screen", "PROBE EXPLORER · ch17 · phone lock screen", fs.GREEN,
          P / "probe-ch17-sms.jpg", source="PROBE EXPLORER · CH 17",
          vo="The farmer never sees any of the backend. He gets one SMS, in Marathi:"),
        S(258, 264, "screen", "PROBE EXPLORER · ch17 · SMS thread", fs.GREEN,
          P / "probe-ch17-sms.jpg", source="PROBE EXPLORER · CH 17",
          vo="शेत सुकत आहे. २–३ दिवसांत पाणी देण्याची तयारी ठेवा.",
          sub="Field is drying. Plan to irrigate in 2–3 days."),
        S(264, 280, "screen", "PROBE EXPLORER · ch17 · app opens", fs.GREEN,
          P / "probe-ch17-app.jpg", source="PROBE EXPLORER · CH 17",
          vo=("One tap opens the app: today's water level, the plan, the rain forecast, "
              "and a button to call an agronomist.")),
    ]

    # ---------------------------------------------------------------- beat 7
    segs += [
        card(280, 286, "CARD · THREE MODELS", fs.AMBER,
             lambda t, d: fc.pipeline_card(t, d),
             vo="Now, where the AI does its work. Three models, each with one job.",
             source="PROBE EXPLORER · CH 17 · PIPELINE"),
        S(286, 295, "screen", "PROBE EXPLORER · ch11 · calibration", fs.GREEN,
          P / "probe-ch11-calibration.jpg", source="PROBE EXPLORER · CH 11",
          vo=("First, calibration: it turns raw counts into water content, fitted to "
              "oven-dried samples of local soil.")),
        S(295, 305, "screen", "PROBE EXPLORER · ch9 · anomaly view", fs.GREEN,
          P / "probe-ch09-leak.jpg", source="PROBE EXPLORER · CH 09",
          vo=("Second, anomaly detection: an Isolation Forest compares how fast each node dries. "
              "That's how B2's leak gets caught.")),
        card(305, 317, "SAR · REAL U-NET OUTPUT · SPAIN TEST CHIP", fs.WATER,
             lambda t, d: fc.sar_triptych_card(t, d),
             vo=("Third, space. We trained a U-Net on Sentinel-1 radar to map water across "
                 "whole fields. Here is a radar chip, our prediction, and the ground truth."),
             source="SEN1FLOODS11 · SPAIN_7370579 · 512²"),
        card(317, 325, "SAR · 89-CHIP MEAN · 0.3817", fs.WATER,
             lambda t, d: fc.sar_metrics_card(t, d),
             vo=("Per-chip mean IoU is zero point three eight. A working first model, and the "
                 "number we'll push up with more labelled fields."),
             source="89 OF 90 TEST CHIPS · THRESHOLD 0.50"),
        card(325, 340, "CARD · THE DISAGREEMENT ENGINE", fs.AMBER,
             lambda t, d: fc.disagreement_card(t, d),
             vo=("And the part I care most about: the disagreement engine. If the probe says wet "
                 "and the radar says dry, we don't average them. We flag the field for a person "
                 "to check. That's what makes the record trustworthy."),
             source="EVIDENCE ENGINE · ROUND 1 DECK"),
    ]

    # ---------------------------------------------------------------- beat 8
    segs += [
        S(340, 350, "screen", "DASHBOARD · DEMO MODE · farm view", fs.WATER,
          DB / "dash-overview.png", source="DASHBOARD · DEMO MODE", screen=True, fit=True,
          vo="All of this lands on one dashboard. This is the farm view, every field coloured by its state."),
        S(350, 362, "screen", "DASHBOARD · DEMO MODE · field MVL-01", fs.WATER,
          DB / "field-top.png", source="DASHBOARD · DEMO MODE", screen=True, fit=True,
          vo=("Open a field and you get today's decision, the four probe bands, "
              "the water history and the SMS that went out.")),
        S(362, 372, "screen", "DASHBOARD · DEMO MODE · 48 h + 3D field", fs.WATER,
          DB / "field-charts.png", source="DASHBOARD · DEMO MODE", screen=True, fit=True,
          vo=("Weather comes from open data for that exact location. Field officers and "
              "farmer groups use this view; farmers just get the SMS.")),
        S(372, 380, "screen", "SITE · PROBE SECTION → EXPLORER", fs.WATER,
          DB / "home-probe.png", source="SITE · PROBE SECTION", screen=True, fit=True,
          vo=("And this explorer, which you've been watching, is part of the site too: "
              "anyone can open it and learn how the probe works.")),
    ]

    # ---------------------------------------------------------------- beat 9
    segs += [
        card(380, 393, "CARD · STATUS", fs.AMBER,
             lambda t, d: fc.honesty_card(1, t, d),
             vo=("To be clear about where we are. The gateway hardware, the dashboard and "
                 "the explorer are built. The SAR model is trained. The probe is designed "
                 "and being printed."),
             source="STATUS · 8 NOV 2026"),
        card(393, 405, "CARD · STATUS + NEXT", fs.AMBER,
             lambda t, d: fc.honesty_card(2, t, d),
             vo=("Probe readings you saw are simulated, and the thresholds are illustrative "
                 "until we calibrate in real soil. That calibration is the first job of our pilot."),
             source="STATUS · 8 NOV 2026"),
    ]

    # ---------------------------------------------------------------- beat 10
    segs += [
        card(405, 417, "CARD · IPCC DEFAULTS", fs.GREEN,
             lambda t, d: fc.ipcc_card(t, d),
             vo=("Why this is worth building: on one hectare, IPCC defaults put continuous "
                 "flooding at around a hundred and forty kilograms of methane a season, and "
                 "AWD at around eighty."),
             source="IPCC DEFAULTS · ONE HECTARE · ONE SEASON"),
        card(417, 423, "CARD · ₹14,995 PROTOTYPE", fs.AMBER,
             lambda t, d: fc.cost_card(t, d),
             vo=("Our prototype setup, three field nodes and a gateway, costs about fifteen "
                 "thousand rupees."),
             source="ROUND 1 DECK · SLIDE 14 · JULY 2026 BOM"),
        S(423, 431, "screen", "DECK VISUAL · GO TO MARKET", fs.AMBER,
          DV / "09_slide_09_business_model_visual.jpg",
          source="DECK VISUAL · AI-GENERATED",
          vo="We start with farmer producer organisations, then KVK pilots,"),
        S(431, 440, "screen", "DECK VISUAL · SAME PLATFORM", fs.AMBER,
          DV / "10_slide_10_scale_visual.jpg",
          source="DECK VISUAL · AI-GENERATED",
          vo=("then use the same records for methane-credit verification. And the platform "
              "carries over to sugarcane, wheat and cotton.")),
    ]

    # ---------------------------------------------------------------- beat 11
    segs += [
        card(440, 450, "FACE CAM · TAKE 3 · CLOSE", fs.RED,
             lambda t, d: fc.face_card(3, face3, "CLOSE · 7:20-7:30", t, d),
             vo=face3, band=False),
        card(450, 455, "END CARD", fs.GREEN,
             lambda t, d: fc.end_card(t, d),
             vo="I'm Neeraj Parekh, team FusionForge. Thank you.",
             caption=True, caption_y=770),
    ]
    return segs


# ------------------------------------------------------------------ helpers
def fades(a, b):
    dur = b - a
    out = []
    if a == 0:
        out.append("fade=t=in:st=0:d=0.6")
    elif a in BOUND:
        out.append("fade=t=in:st=0:d=0.16")
    if b == TOTAL:
        out.append("fade=t=out:st=%.3f:d=0.6" % (dur - 0.6))
    elif b in BOUND:
        out.append("fade=t=out:st=%.3f:d=0.16" % (dur - 0.16))
    return out


def progress_chain(a, base="tmp", bar_idx=2, cover_idx=3):
    """Full accent bar, with a dark cover sliding right to reveal the elapsed part."""
    return ("[%s][%d:v]overlay=0:1076[t2];[t2][%d:v]overlay="
            "x='1920*min(1\\,max(0\\,(%.3f+t)/%.3f))':y=1076"
            % (base, bar_idx, cover_idx, a, TOTAL))


def graded_source(seg, idx):
    src = Path(seg["src"])
    out = GRADE / ("%03d.jpg" % idx)
    if out.exists():
        return out
    im = fs.cover(Image.open(src), 2016, 1134)
    im = fs.grade(im, warm=1.012, desat=0.04, lift=2)
    im.save(out, quality=93)
    return out


def make_overlay(seg):
    """Static lower third + top chrome for photographs, slides and clips."""
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    if seg["vo"]:
        layer = Image.alpha_composite(layer, fs.lower_third_layer(
            seg["vo"], seg["a"], seg["accent"], sub=seg["sub"], paper=False,
            source=seg.get("source")))
    if seg["kind"] in ("photo", "clip"):
        layer = Image.alpha_composite(layer, fs.photo_chrome_layer(
            seg["a"], TOTAL, fs.beat_name(seg["a"])))
    return layer


def make_card_deco(seg):
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    if seg["band"]:
        layer = Image.alpha_composite(layer, fs.lower_third_layer(
            seg["vo"], seg["a"], seg["accent"], sub=seg["sub"],
            paper=seg["paper"], source=None))
    elif seg["caption"] and seg["vo"]:
        layer = Image.alpha_composite(layer, fs.caption_layer(
            seg["vo"], seg["accent"], y=seg["caption_y"], paper=False))
    if layer.getbbox() is None:
        return None
    return layer


# ------------------------------------------------------------------ encoders
def encode_still(seg, idx):
    dur = seg["b"] - seg["a"]
    ovp = OV / ("%03d.png" % idx)
    make_overlay(seg).save(ovp)

    if seg["kind"] == "photo":
        src = graded_source(seg, idx)
        forward = idx % 2 == 0
        travel = "(t/%.4f)" % dur if forward else "(1-t/%.4f)" % dur
        pan = ("scale=2016:1134:force_original_aspect_ratio=increase:in_range=full:out_range=tv,"
               "crop=2016:1134,"
               "crop=1920:1080:x='(in_w-out_w)*%s':y='(in_h-out_h)/2'" % travel)
    else:
        src = Path(seg["src"])
        if seg.get("fit"):
            pan = ("scale=1920:908:force_original_aspect_ratio=decrease,"
                   "pad=1920:1080:(out_w-in_w)/2:0:color=0x0B2E22")
        elif seg["kind"] == "screen":
            pan = ("scale=1920:1080:force_original_aspect_ratio=decrease,"
                   "pad=1920:1080:(out_w-in_w)/2:0:color=0x0B2E22")
        else:
            pan = "scale=1920:1080"

    fc_chain = "[0:v]" + pan + ",setsar=1,fps=24[bg];"
    fc_chain += "[bg][1:v]overlay=0:0[tmp];"
    fc_chain += progress_chain(seg["a"], "tmp", 2, 3)
    for f in fades(seg["a"], seg["b"]):
        fc_chain += "," + f
    fc_chain += ",format=yuv420p[v]"

    out = SEG / ("%03d.mp4" % idx)
    cmd = ["ffmpeg", "-v", "error", "-y",
           "-loop", "1", "-framerate", str(FPS), "-t", str(dur), "-i", str(src),
           "-loop", "1", "-framerate", str(FPS), "-t", str(dur), "-i", str(ovp),
           "-loop", "1", "-framerate", str(FPS), "-t", str(dur), "-i", str(BUILD / "bar.png"),
           "-loop", "1", "-framerate", str(FPS), "-t", str(dur), "-i", str(BUILD / "cover.png"),
           "-filter_complex", fc_chain, "-map", "[v]", "-t", str(dur),
           "-c:v", "libx264", "-preset", PRESET, "-crf", CRF,
           "-pix_fmt", "yuv420p",
           "-color_range", "tv", "-colorspace", "bt709",
           "-color_primaries", "bt709", "-color_trc", "bt709", "-r", str(FPS), str(out)]
    subprocess.run(cmd, check=True)
    return out


def encode_clip(seg, idx):
    dur = seg["b"] - seg["a"]
    ovp = OV / ("%03d.png" % idx)
    make_overlay(seg).save(ovp)

    fc_chain = ("[0:v]scale=1920:1080:force_original_aspect_ratio=increase,"
                "crop=1920:1080,eq=saturation=0.94:contrast=1.03,setsar=1,fps=24[bg];")
    fc_chain += "[bg][1:v]overlay=0:0[tmp];"
    fc_chain += progress_chain(seg["a"], "tmp", 2, 3)
    for f in fades(seg["a"], seg["b"]):
        fc_chain += "," + f
    fc_chain += ",format=yuv420p[v]"

    out = SEG / ("%03d.mp4" % idx)
    cmd = ["ffmpeg", "-v", "error", "-y",
           "-ss", str(seg["ss"]), "-t", str(dur), "-i", seg["src"],
           "-loop", "1", "-framerate", str(FPS), "-t", str(dur), "-i", str(ovp),
           "-loop", "1", "-framerate", str(FPS), "-t", str(dur), "-i", str(BUILD / "bar.png"),
           "-loop", "1", "-framerate", str(FPS), "-t", str(dur), "-i", str(BUILD / "cover.png"),
           "-filter_complex", fc_chain, "-map", "[v]", "-an", "-t", str(dur),
           "-c:v", "libx264", "-preset", PRESET, "-crf", CRF,
           "-pix_fmt", "yuv420p",
           "-color_range", "tv", "-colorspace", "bt709",
           "-color_primaries", "bt709", "-color_trc", "bt709", "-r", str(FPS), str(out)]
    subprocess.run(cmd, check=True)
    return out


def encode_card(seg, idx):
    a, b = seg["a"], seg["b"]
    dur = b - a
    deco = make_card_deco(seg)
    anim = min(ANIM, dur)
    n_frames = int(round(anim * FPS))

    anim_out = PARTS / ("%03d-anim.mp4" % idx)
    cmd = ["ffmpeg", "-v", "error", "-y",
           "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", "%dx%d" % (W, H),
           "-r", str(FPS), "-i", "-",
           "-loop", "1", "-framerate", str(FPS), "-t", str(anim),
           "-i", str(BUILD / "bar.png"),
           "-loop", "1", "-framerate", str(FPS), "-t", str(anim),
           "-i", str(BUILD / "cover.png"),
           "-filter_complex",
           "[0:v]fps=24[bg];" + progress_chain(a, "bg", 1, 2) +
           ("," + ",".join(fades(a, a + anim)) if fades(a, a + anim) else "") +
           ",format=yuv420p[v]",
           "-map", "[v]", "-t", str(anim),
           "-c:v", "libx264", "-preset", PRESET, "-crf", CRF,
           "-pix_fmt", "yuv420p",
           "-color_range", "tv", "-colorspace", "bt709",
           "-color_primaries", "bt709", "-color_trc", "bt709", "-r", str(FPS), str(anim_out)]

    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    last = None
    for i in range(n_frames):
        t = i / FPS
        im = seg["render"](t, dur).convert("RGB")
        if deco is not None:
            im = Image.alpha_composite(im.convert("RGBA"), deco).convert("RGB")
        last = im
        proc.stdin.write(im.tobytes())
    proc.stdin.close()
    if proc.wait() != 0:
        raise RuntimeError("card anim encode failed for %s" % seg["label"])

    if dur <= anim + 1e-6:
        out = SEG / ("%03d.mp4" % idx)
        shutil.copy(anim_out, out)
        return out

    last_png = HOLD / ("%03d.png" % idx)
    last.save(last_png)
    hold = dur - anim
    hold_out = PARTS / ("%03d-hold.mp4" % idx)
    cmd = ["ffmpeg", "-v", "error", "-y",
           "-loop", "1", "-framerate", str(FPS), "-t", str(hold), "-i", str(last_png),
           "-loop", "1", "-framerate", str(FPS), "-t", str(hold),
           "-i", str(BUILD / "bar.png"),
           "-loop", "1", "-framerate", str(FPS), "-t", str(hold),
           "-i", str(BUILD / "cover.png"),
           "-filter_complex",
           "[0:v]fps=24[bg];" + progress_chain(a + anim, "bg", 1, 2) +
           ("," + ",".join(fades(a + anim, b)) if fades(a + anim, b) else "") +
           ",format=yuv420p[v]",
           "-map", "[v]", "-t", str(hold),
           "-c:v", "libx264", "-preset", PRESET, "-crf", CRF,
           "-pix_fmt", "yuv420p",
           "-color_range", "tv", "-colorspace", "bt709",
           "-color_primaries", "bt709", "-color_trc", "bt709", "-r", str(FPS), str(hold_out)]
    subprocess.run(cmd, check=True)

    out = SEG / ("%03d.mp4" % idx)
    cat = PARTS / ("%03d.txt" % idx)
    cat.write_text("file '%s'\nfile '%s'\n" % (anim_out, hold_out))
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0",
                    "-i", str(cat), "-c", "copy", str(out)], check=True)
    return out


# ------------------------------------------------------------------ docs
def tc(t):
    return "%d:%02d" % (int(t) // 60, int(t) % 60)


def srt_ts(t):
    h = int(t // 3600)
    m = int((t % 3600) // 60)
    s = int(t % 60)
    ms = int(round((t - int(t)) * 1000))
    return "%02d:%02d:%02d,%03d" % (h, m, s, ms)


def write_docs(segs):
    lines = ["# Voice-over cues · 7:35 animatic (v2)",
             "",
             "Record each line against the v2 animatic. The in-point is the shot start; the",
             "out-point is the next shot. Leave half a second of room tone at both ends.",
             "",
             "| In | Out | Beat | Shot | Line |",
             "|---|---|---|---|---|"]
    for s in segs:
        if not s["vo"]:
            continue
        vo = s["vo"] + ((" / " + s["sub"]) if s["sub"] else "")
        lines.append("| %s | %s | %s | %s | %s |" % (
            tc(s["a"]), tc(s["b"]), fs.beat_name(s["a"]), s["label"],
            vo.replace("|", "/")))
    lines += ["", "Total 7:35 (455 s).", ""]
    (HERE / "VO-CUES.md").write_text("\n".join(lines), encoding="utf-8")

    out = []
    for i, s in enumerate([x for x in segs if x["vo"]], 1):
        text = s["vo"] + ((" " + s["sub"]) if s["sub"] else "")
        out += [str(i), "%s --> %s" % (srt_ts(s["a"]), srt_ts(s["b"])), text, ""]
    (HERE / "AGRI-GRID-Round2-animatic.srt").write_text("\n".join(out), encoding="utf-8")


KEY_TIMES = [17, 22, 30, 42, 65, 76, 90, 110, 155, 175,
             196, 199, 211, 218, 223, 260, 282, 310, 320, 330,
             345, 385, 410, 420, 452]


def contact_sheet(video, segs):
    tmp = BUILD / "thumbs"
    tmp.mkdir(exist_ok=True)
    picks = []
    for i, t in enumerate(KEY_TIMES[:25]):
        p = tmp / ("%02d.jpg" % i)
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", "%.3f" % t,
                        "-i", str(video), "-frames:v", "1", "-vf",
                        "scale=384:216:force_original_aspect_ratio=increase,crop=384:216",
                        str(p)], check=True)
        picks.append(p)
    sheet = Image.new("RGB", (1920, 1080), fs.PAPER)
    for i, p in enumerate(picks):
        im = Image.open(p).convert("RGB")
        x = (i % 5) * 384
        y = (i // 5) * 216
        sheet.paste(im, (x, y))
    d = ImageDraw.Draw(sheet, "RGBA")
    for i in range(1, 5):
        d.line([(i * 384, 0), (i * 384, 1080)], fill=(245, 246, 241, 120), width=2)
        d.line([(0, i * 216), (1920, i * 216)], fill=(245, 246, 241, 120), width=2)
    sheet.save(HERE / "AGRI-GRID-Round2-animatic-v2-contact-sheet.png")


def main():
    smoke = "--smoke" in sys.argv
    only = None
    for arg in sys.argv[1:]:
        if arg.startswith("--only="):
            only = set(float(x) for x in arg.split("=")[1].split(","))

    (Image.new("RGB", (1920, 4), fs.ACCENT)).save(BUILD / "bar.png")
    (Image.new("RGB", (1920, 4), fs.FOREST_2)).save(BUILD / "cover.png")

    segs = build_segments()
    total = sum(s["b"] - s["a"] for s in segs)
    assert abs(total - TOTAL) < 0.01, total
    for s in segs:
        if s["kind"] not in ("card",):
            assert Path(s["src"]).exists(), s["src"]
    print("segments", len(segs), "total", total, flush=True)

    if smoke:
        pick = [s for s in segs if s["a"] in (38, 305, 198, 423, 15, 21)]
    elif only:
        pick = [s for s in segs if s["a"] in only]
    else:
        pick = segs

    t0 = time.time()
    outs = []
    for i, s in enumerate(pick, 1):
        if s["kind"] == "clip":
            out = encode_clip(s, int(s["a"]))
        elif s["kind"] == "card":
            out = encode_card(s, int(s["a"]))
        else:
            out = encode_still(s, int(s["a"]))
        outs.append(out)
        print("%02d/%d  %s  %s  %.1fs" % (i, len(pick), tc(s["a"]), out.name,
                                          time.time() - t0), flush=True)

    if smoke:
        print("smoke ok", [p.name for p in outs])
        return

    if only:
        print("partial ok", [p.name for p in outs])
        return

    concat = BUILD / "concat.txt"
    concat.write_text("".join("file '%s'\n" % p for p in outs))
    video = BUILD / "AGRI-GRID-Round2-animatic-v2-1080p.mp4"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0",
                    "-i", str(concat), "-c", "copy",
                    "-movflags", "+faststart", "-color_range", "tv",
                    "-colorspace", "bt709", "-color_primaries", "bt709",
                    "-color_trc", "bt709", str(video)], check=True)
    shutil.copy(video, HERE / "AGRI-GRID-Round2-animatic-v2-1080p.mp4")
    write_docs(segs)
    contact_sheet(video, segs)
    print("wrote", HERE / "AGRI-GRID-Round2-animatic-v2-1080p.mp4", flush=True)


if __name__ == "__main__":
    main()
