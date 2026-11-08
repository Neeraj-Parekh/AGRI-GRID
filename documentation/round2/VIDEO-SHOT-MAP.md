# AGRI-GRID video — shot map for the 7:35 Round 2 script

Maps every row of `VIDEO-SCRIPT.md` to a local file or URL, and says whether it is ready,
needs recording, is user-held media, or must be made in the edit.

**Canonical site:** <http://localhost:5173/> — newest build, story home + dashboard + `/probe`.
Port 5174 is the 4 Nov rollback and has no `/probe`. The deployed copy is
<https://agri-grid-chi.vercel.app/>; record from localhost so network hiccups cannot enter the
take.

**Probe recording mode:** `http://localhost:5173/probe?record=1&ch=N&t=S&paused=1`.
Record the whole chapter at 1920 × 1080, 60 fps, then cut at the script times. The frame label
(`Design render`, `Simulated data`, `Illustration`, `Literature`) is part of the picture and
must stay on screen.

**Status key:** `READY` asset exists · `RECORD` capture from the running site · `USER`
media only you have · `MAKE` build in the edit · `GAP` not found, needs a decision.

## Record sessions, in this order

| Session | What | Setup |
|---|---|---|
| 1 | Probe Explorer chapters 1, 2, 3, 4, 5, 6, 8, 9, 11, 14, 17, 18 | Chrome, F11, OBS 1920 × 1080 60 fps, `record=1`, one chapter per take |
| 2 | Dashboard `/dashboard`, one field page, charts, home cutaway | Chrome, 1440 or 1920 wide, slow cursor, Demo Mode with the SIMULATED badge visible |
| 3 | Hardware box: exterior, lid open, power on | Your existing hardware video; trim only |
| 4 | Face cam: hook, bench line, close | Phone/webcam 1080p, window light |
| 5 | SAR chips, deck stills, diagram and text cards | Stills + edit |

Do not record the probe in a headless browser or with SwiftShader: it blocks the main thread.
Headful Chrome on the laptop GPU renders the 1920 × 1080 frame with no console errors.

## Beat 1 · Hook · 0:00–0:25

| Time | Visual tag | Local source | Status |
|---|---|---|---|
| 0:00 | PX ch1 t=0–6 | `/probe?record=1&ch=1` · still `assets/probe-stills/probe-ch01-flooded.jpg` | RECORD / READY still |
| 0:07 | PX ch1 t=9–14 | same chapter | RECORD |
| 0:15 | FACE then title | you on camera; title text over `assets/deck-visuals/01_slide_01_title_visual.jpg` | USER + MAKE |

## Beat 2 · The problem · 0:25–1:15

| Time | Visual tag | Local source | Status |
|---|---|---|---|
| 0:25 | PX ch1 t=10–18 | `/probe?record=1&ch=1` | RECORD |
| 0:38 | DECK s02 right half, or PX ch18 t=2–5 | `deck-visuals/02_slide_02_problem_visual.jpg` (no text); `ch=18` | READY background / RECORD |
| 0:50 | PX ch1 t=19–24 | `ch=1` · still `probe-ch01-rule.jpg` | RECORD / READY still |
| 0:57 | DECK s03 | `deck-visuals/03_slide_03_gap_visual.jpg` background, or `round1-deck/slides/slide-03.jpg` (exact Point · Manual · Unverified slide) | READY |

## Beat 3 · The idea · 1:15–1:45

| Time | Visual tag | Local source | Status |
|---|---|---|---|
| 1:15–1:28 | DIAGRAM, three blocks | build in edit: GROUND green, SPACE blue, AI amber; arrows to FARMER and EVIDENCE | MAKE |
| 1:28 alt | DECK s04 | `deck-visuals/04_slide_04_platform_visual.jpg` | READY background |
| 1:38 | PX ch2 t=0–4 | `ch=2` · still `probe-ch02-names.jpg` | RECORD / READY still |

## Beat 4 · The probe · 1:45–3:15

| Time | Visual tag | Local source | Status |
|---|---|---|---|
| 1:45 | PX ch2 t=6–13 | `ch=2` · still `probe-ch02-names.jpg` | RECORD / READY still |
| 1:55 | PX ch2 t=16–22 | `ch=2` · still `probe-ch02-xray.jpg` | RECORD / READY still |
| 2:04 | PX ch3 t=1–5 then 7–15 | `ch=3` · stills `probe-ch03-print.jpg`, `probe-ch03-copper.jpg`, `probe-ch03-wiring.jpg` | RECORD / READY stills |
| 2:13 | PX ch4 t=3–7 then 12–17 | `ch=4` · stills `probe-ch04-wall.jpg`, `probe-ch04-resistive.jpg` | RECORD / READY stills |
| 2:25 | PX ch5 t=8–14 | `ch=5` · still `probe-ch05-fringing.jpg` | RECORD / READY still |
| 2:32 | PX ch5 t=16–26 | `ch=5` | RECORD |
| 2:47 | PX ch6 t=1–14 | `ch=6` · still `probe-ch06-guards.jpg` | RECORD / READY still |
| 2:53 | PX ch8 t=3–26 | `ch=8` · still `probe-ch08-drying.jpg` | RECORD / READY still |
| 3:08 | PX ch8 t=27–33 | `ch=8` · still `probe-ch08-irrigate.jpg` | RECORD / READY still |

## Beat 5 · The hardware we have · 3:15–3:50

| Time | Visual tag | Local source | Status |
|---|---|---|---|
| 3:15 | FACE, 2 s | you with the box | USER (face cam not recorded yet) |
| 3:18 | HW exterior → lid → internals, power off | `assets/hardware/gateway-electronics-1080p.mp4` 0:00–0:03, then `gateway-internals-closeup.mp4` 0:00–0:05 | READY clip |
| 3:30 | HW power on, LEDs, 4 s | `gateway-electronics-1080p.mp4` 0:00–0:04 (green LED) | READY clip |
| 3:36 | BUILD-SHEET 2 s → CIRCUIT 2 s → PX ch14 t=6–12 | `assets/prototype-circuits/AGRI_GRID_Prototype_Build_Sheet.pdf`; `assets/prototype-circuits/png/hero.png`; `assets/hardware/esp32-bench-wiring-1.jpg`; `ch=14` · `probe-ch14-circuit.jpg` | READY + RECORD |

## Beat 6 · The grid and the farmer · 3:50–4:40

| Time | Visual tag | Local source | Status |
|---|---|---|---|
| 3:50 | PX ch9 t=0–7 | `ch=9` | RECORD |
| 4:02 | PX ch9 t=9–14 | `ch=9` · still `probe-ch09-leak.jpg` | RECORD / READY still |
| 4:12 | PX ch17 t=20–24 | `ch=17&lang=mr` · still `probe-ch17-sms.jpg` | RECORD / READY still |
| 4:18 | PX ch17 t=25–28 | same | RECORD |
| 4:24 | PX ch17 t=29–36 | same · still `probe-ch17-app.jpg` | RECORD / READY still |

## Beat 7 · The AI · 4:40–5:40

| Time | Visual tag | Local source | Status |
|---|---|---|---|
| 4:40 | PX ch17 t=4–18, crop left half | `ch=17` | RECORD |
| 4:46 | PX ch11 t=20–28 | `ch=11` · still `probe-ch11-calibration.jpg` | RECORD / READY still |
| 4:55 | DASH anomaly/evidence, or PX ch9 t=10–13 | `http://localhost:5173/dashboard` and `/evidence`; alt `ch=9` | RECORD |
| 5:05 | SAR input → prediction → ground truth | `assets/sar/sar-triptych-1920x1080.png`; separate panels `sar-panel-vv.jpg`, `sar-panel-pred.jpg`, `sar-panel-gt.jpg` | READY |
| 5:17 | SAR metrics card, mIoU 0.38 | `assets/sar/sar-metrics-card-1920x1080.png` | READY |
| 5:25 | DECK s08 bottom half | `deck-visuals/08_slide_08_evidence_visual.jpg` | READY background |

## Beat 8 · The dashboard · 5:40–6:20

| Time | Visual tag | Local source | Status |
|---|---|---|---|
| 5:40 | DASH `/dashboard` overview, hover map | `http://localhost:5173/dashboard` | RECORD |
| 5:50 | DASH field page → Probe bands E1–E4 + EW | `http://localhost:5173/fields/AGRI-001` | RECORD |
| 6:02 | DASH 48 h charts, then 3D field | same dashboard | RECORD |
| 6:12 | home probe cutaway → `/probe` | `http://localhost:5173/` then `http://localhost:5173/probe` | RECORD |

Dashboard honesty: keep Demo Mode on, so the `DEMO MODE · sensor node readings simulated`
badge is visible. Do not switch to Live Mode for the field-data shots; the Live store is an
empty prototype and would overclaim.

## Beat 9 · Where we honestly are · 6:20–6:45

| Time | Visual tag | Local source | Status |
|---|---|---|---|
| 6:20 | TEXT two-column card | build in edit: Built ✓ gateway · dashboard · explorer · SAR model; In build → probe · field nodes | MAKE |
| 6:33 | same card + “Next: 7-day field pilot” | edit | MAKE |

## Beat 10 · Impact and scale · 6:45–7:20

| Time | Visual tag | Local source | Status |
|---|---|---|---|
| 6:45 | PX ch18 t=7–12 | `ch=18&costs=0` · still `probe-ch18-ipcc.jpg` | RECORD / READY still |
| 6:57 | DECK s05 cost card only | `round1-deck/slides/slide-14.jpg` — **₹14,995 verified**, 3 nodes + gateway, July prototype BOM; background `deck-visuals/05_slide_05_ground_hardware_visual.jpg` optional | READY |
| 7:03 | DECK s09 flow, then s10 crops | `deck-visuals/09_slide_09_business_model_visual.jpg`, `10_slide_10_scale_visual.jpg` | READY backgrounds |

## Beat 11 · Close · 7:20–7:35

| Time | Visual tag | Local source | Status |
|---|---|---|---|
| 7:20 | FACE, straight to camera | you | USER |
| 7:30 | DECK s01 title slide | `round1-deck/slides/slide-01.jpg` (replace the `TEAM [TBD]` footer with the credit), or `deck-visuals/01_slide_01_title_visual.jpg` + credit text | READY + overlay |

## What is still missing

1. **Face cam and voice** — you are recording these. The eight 16 Oct takes in
   `~/Videos/Camera/` are generic talking-head b-roll, not script takes. Everything else for
   the hardware beat is in `assets/hardware/`: the gateway clip, the internals close-up, the
   LED shot and the ESP32 bench stills. Record against the **7:35 scratch animatic** in
   `assets/animatic/`; its README has the three face takes and the audio settings, and
   `VO-CUES.md` has every line with its in/out point.
2. **Text and diagram cards** — the Beat 3 diagram, the Beat 9 honesty card and the
   `LIVE` / `DEMO` / `CAD` / `AI visual` / `NOT YET BUILT` labels are edit work. The Round 1
   deck text layer is now present in `assets/round1-deck/`, so the `[DECK sNN]` slides no longer
   block the edit.

**Resolved since the first pass:** the SAR triptych and the 0.3817 card were generated on
8 Nov from the real checkpoint, not a mock-up — see `assets/sar/`. The triptych is one
Sen1Floods11 official-test chip (Spain) with per-chip IoU 0.61. The 0.3817 card stays separate
because it is the 89-chip mean, and the card says so. The terrain paper's 0.524 figures and its
chips are not used.

**Not missing:** `surat.jpg` is not needed. This script does not use chapter 16, the only
chapter that reads it. Chapter 10 (SAR pass) is also unused; the script's space beat uses the
SAR model chips instead.

## Script links that changed

The script says the site runs at `localhost:5173`; that is now true for `/probe` as well. If a
link was copied from an older note, replace `5174` with `5173`. The deployed equivalent is
`https://agri-grid-chi.vercel.app/probe?...`.
