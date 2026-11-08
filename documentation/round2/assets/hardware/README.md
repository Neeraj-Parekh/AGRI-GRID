# Gateway prototype footage (7 Nov 2026)

Source: `/home/neeraj-parekh/NyxShared/20261107_154228.mp4`, a 33.1 s phone clip,
1920 × 1080 stream with a −90° rotation flag (portrait 1080 × 1920 after rotation), 30 fps,
AAC mono. The originals are outside git; these copies are for the edit.

| File | What it shows |
|---|---|
| `gateway-electronics-1080p.mp4` | whole clip on a 1920 × 1080 canvas: blurred background, full portrait frame centred |
| `gateway-internals-closeup.mp4` | 26–32 s, cropped and scaled to 1920 × 1080: IOTPS-Mini modules, green board, wiring, glands |
| `gateway-internals-closeup.jpg` | poster frame for the close-up |
| `gateway-frame-0s.jpg` | three enclosure boxes on the bench, one open with the green LED on |
| `gateway-frame-8s.jpg` | breadboard with ESP32 and the radio module, hand adjusting wires |
| `gateway-frame-24s.jpg` | bench wide shot, LED glow |
| `gateway-frame-30s.jpg` | open enclosure, second angle |
| `esp32-bench-wiring-1.jpg`, `esp32-bench-wiring-2.jpg` | 1920 × 1080 stills of the ESP12F/ESP32 bench wiring, from the two JPGs in `NyxShared` |

## How to cut it into the script

| Script time | Shot | Source |
|---|---|---|
| 3:15 | you with the box | face cam, still to record |
| 3:18 | box exterior, three enclosures | `gateway-electronics-1080p.mp4` 0:00–0:03 |
| 3:21 | lid open, internals | `gateway-internals-closeup.mp4` 0:00–0:05 |
| 3:30 | power on, LEDs, hold 4 s | `gateway-electronics-1080p.mp4` 0:00–0:04 (green LED) |
| 3:36 | build sheet → circuit → bench wiring | `../prototype-circuits/AGRI_GRID_Prototype_Build_Sheet.pdf`, `../prototype-circuits/png/hero.png`, `esp32-bench-wiring-1.jpg` |

The clip is powered on throughout; there is no separate power-off take. If the voice-over says
"power off", either cut that word or shoot a short switch-off insert. Do not pretend the clips
show a power cycle they do not contain.

The enclosure is a clear IP65 box with an IOTPS-Mini AC-DC module, a green carrier board, a
Li-ion cell and gland entries. It is the **gateway prototype**, not the V2 Fibox station in the
CAD package. Keep the two apart on screen.
