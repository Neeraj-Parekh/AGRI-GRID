# Recording the Probe Explorer

The explorer lives at `/probe`. Every frame is a pure function of the timeline, so a link with `?ch=&t=&paused=1`
always shows the same picture: record a chapter as many times as you like and the takes will match.

## Quick setup for a clean 1080p take

1. Open `/probe?record=1` in Chrome (desktop). The view is a fixed 1920 × 1080 frame scaled to the window.
2. Press **F11** for full screen, then start your screen recorder (OBS: Display Capture or Window Capture, 1920 × 1080, 30 or 60 fps).
3. Chapters autoplay in order with a 1 s hold between them.
4. Keys: **space** play/pause · **←/→** seek 5 s · **1–9** jump to chapter · **R** restart · **H** hide the HUD · **C** clean frame (only the 3D view).
5. The small frame counter at the top-left sits outside the 1920 × 1080 frame and hides in clean mode.

## Useful links

| What | Link |
|---|---|
| Whole story, HUD on | `/probe?record=1` |
| One chapter, paused at a moment | `/probe?record=1&ch=5&t=12&paused=1` |
| Field (ideal) hardware | add `&variant=field` |
| Hide every ₹ figure | add `&costs=0` |
| Marathi interface | add `&lang=mr` (SMS and the phone are in Marathi by default) |
| Lower GPU load | add `&quality=medium` or `&quality=low` |
| Only some chapters | add `&hide=4,11,12,13` |
| Fewer panels | add `&panels=chapter,captions,honesty` |

The ☰ menu builds these for you: choose sections, panels, hardware, quality and language, then **Copy link to this setup**.

## Chapter map (default durations)

| # | Chapter | Length | Good still |
|---|---|---|---|
| 1 | The problem | 26 s | `ch=1&t=4` flooded · `ch=1&t=21` the −15 cm rule |
| 2 | Meet the probe | 24 s | `ch=2&t=10` names · `ch=2&t=20` X-ray |
| 3 | Print and build | 34 s | `ch=3&t=3` print bed · `ch=3&t=21` wiring |
| 4 | Why nothing corrodes | 22 s | `ch=4&t=5` wall · `ch=4&t=15` resistive sensor |
| 5 | How it senses | 30 s | `ch=5&t=12` fringing field · `ch=5&t=22` zoom |
| 6 | Guard rings and reference | 26 s | `ch=6&t=5` / `ch=6&t=12` |
| 7 | Install it | 28 s | `ch=7&t=12` air gap |
| 8 | One AWD cycle | 34 s | `ch=8&t=20` drying · `ch=8&t=31` IRRIGATE |
| 9 | The grid talks | 30 s | `ch=9&t=11` B2 leak · `ch=9&t=25` pump |
| 10 | Ground meets space | 28 s | `ch=10&t=8` SAR pass |
| 11 | Calibrate it | 30 s | `ch=11&t=27` fitted curve |
| 12 | When readings lie | 36 s | six 6 s beats |
| 13 | The three prints | 22 s | `ch=13&t=12` |
| 14 | Inside the node | 30 s | `ch=14&t=14` circuit overlay |
| 15 | The farm grid | 26 s | `ch=15&t=8` Prototype · `ch=15&t=20` Field |
| 16 | Ground + space, real data | 24 s | add `public/media/sar/surat.jpg` first |
| 17 | Backend + farmer | 36 s | `ch=17&t=31` app open |
| 18 | Impact and scale | 30 s | `ch=18&t=20` |

## Before recording chapter 16

Copy the team's Surat SAR figure to `frontend/public/media/sar/surat.jpg` (16:8 crop works best). Until then the panel shows a
synthetic placeholder that says so.

## Honesty line

The small sentence at the top-left says what each frame is (design render, simulated data, literature). Keep it on for judges;
turn it off in ☰ → Panels only for B-roll where the voice-over says it instead.
