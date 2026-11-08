# Probe Explorer stills (1920 × 1080)

Twenty-one paused frames captured from the live Probe Explorer at
`http://localhost:5173/probe?record=1&…&paused=1`, rendered by Chrome on the laptop GPU
(not SwiftShader). Each frame is a pure function of the timeline, so the same link reproduces
the same picture.

The first nine are general chapter frames. The second group was captured at the exact timestamps
the 7:35 Round 2 script asks for, so each one can stand in for a clip or be used as the poster
frame for a take.

## Script frames (captured to match `VIDEO-SCRIPT.md`)

| File | Chapter | Script line | Link suffix |
|---|---|---|---|
| `probe-ch01-rule.jpg` | 1 The problem | 0:50, the −15 cm rule | `ch=1&t=21` |
| `probe-ch02-names.jpg` | 2 Meet the probe | 1:38 and 1:45, names and scale | `ch=2&t=10` |
| `probe-ch03-copper.jpg` | 3 Print and build | 2:04, copper in, halves closing | `ch=3&t=11` |
| `probe-ch03-wiring.jpg` | 3 Print and build | 2:04 extra, wires along the ribs | `ch=3&t=21` |
| `probe-ch04-wall.jpg` | 4 Why nothing corrodes | 2:13, 1.6 mm wall close-up | `ch=4&t=5` |
| `probe-ch04-resistive.jpg` | 4 Why nothing corrodes | 2:13, resistive sensor corroding | `ch=4&t=15` |
| `probe-ch06-guards.jpg` | 6 Guard rings | 2:47, field overlap without guards | `ch=6&t=8` |
| `probe-ch08-irrigate.jpg` | 8 One AWD cycle | 3:08, IRRIGATE NOW at −15 cm | `ch=8&t=31` |
| `probe-ch09-leak.jpg` | 9 The grid talks | 4:02, B2 leaking bund | `ch=9&t=11` |
| `probe-ch11-calibration.jpg` | 11 Calibrate it | 4:46, cups, oven, fitted curve | `ch=11&t=27` |
| `probe-ch17-sms.jpg` | 17 Backend + farmer | 4:12, phone with the Marathi SMS | `ch=17&t=22` |
| `probe-ch18-ipcc.jpg` | 18 Impact and scale | 6:45, IPCC formula card | `ch=18&t=9` |

## General chapter frames

| File | Chapter | Link suffix |
|---|---|---|
| `probe-ch01-flooded.jpg` | 1 The problem | `ch=1&t=4` |
| `probe-ch02-xray.jpg` | 2 Meet the probe | `ch=2&t=20` |
| `probe-ch03-print.jpg` | 3 Print and build | `ch=3&t=3` |
| `probe-ch05-fringing.jpg` | 5 How it senses | `ch=5&t=12` |
| `probe-ch07-airgap.jpg` | 7 Install it | `ch=7&t=12` |
| `probe-ch08-drying.jpg` | 8 One AWD cycle | `ch=8&t=20` |
| `probe-ch10-sar.jpg` | 10 Ground meets space | `ch=10&t=8` |
| `probe-ch14-circuit.jpg` | 14 Inside the node | `ch=14&t=14` |
| `probe-ch17-app.jpg` | 17 Backend + farmer | `ch=17&t=31` |

Prefix every link with `/probe?record=1&` and add `&paused=1`. The frame label in the top-left
(`Design render`, `Simulated data`, `Illustration`, `Literature`) is part of the image and should
stay on screen; it is the honesty label, not a defect.

`ch10` uses the synthetic SAR pass because `public/media/sar/surat.jpg` is still missing; the
frame says "illustrative, not to scale". The 7:35 script does not use chapter 10 or chapter 16,
so this frame is spare, not a blocker.

The full-size PNGs are in `../../../../agri-sites/screenshots/` (outside git); these JPGs are
quality-88 copies for the edit and for slides.

Source app: `websites/2026-11-08-probe-explorer/frontend/src/probe/`; chapter map and recording
keys in `frontend/src/probe/RECORDING.md`.
