# Probe Explorer stills (1920 × 1080)

Nine paused frames captured from the live Probe Explorer at
`http://localhost:5174/probe?record=1&…&paused=1`, rendered by Chrome on the laptop GPU
(not SwiftShader). Each frame is a pure function of the timeline, so the same link reproduces
the same picture.

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
(`Design render`, `Simulated data`, `Illustration`) is part of the image and should stay on
screen; it is the honesty label, not a defect.

`ch10` uses the synthetic SAR pass because `public/media/sar/surat.jpg` is still missing; the
frame says "illustrative, not to scale". Replace it and re-render when the team supplies the
Surat figure.

The full-size PNGs are in `../../../../agri-sites/screenshots/` (outside git); these JPGs are
quality-88 copies for the edit and for slides.

Source app: `websites/2026-11-08-probe-explorer/frontend/src/probe/`; chapter map and recording
keys in `frontend/src/probe/RECORDING.md`.
