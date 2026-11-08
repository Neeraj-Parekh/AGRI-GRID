# AGRI-GRID Round 2 · animatic v2 design

The v1 animatic was a source map: every shot labelled, every line burned in, every asset held
for its script duration. v2 keeps that job but makes the picture carry the argument. A viewer
should be able to follow the story with the sound off; the narration then confirms what the
picture already says.

## System

### Palette

The palette is lifted from the live product, not invented for the video.

| Token | Hex | Use |
|---|---|---|
| Paper | `#F5F6F1` | card stock, page background |
| Forest | `#073B2A` | dark cards, headline type |
| Forest 2 | `#0B2E22` | deep background, lower-third band |
| Ink | `#16231D` | primary type |
| Green | `#2F7D46` | ground truth, confirmed states |
| Accent | `#79C95B` | progress bar, one brand accent |
| Water | `#2D78B7` | radar and water data |
| Soft | `#6FB6D9` | secondary water tone |
| Amber | `#D99A25` | attention, cost, caveats |
| Red | `#C94D3D` | baseline emissions, missing takes |
| Muted | `#65716B` | secondary copy |
| Border | `#DEE2D8` | hairlines and card outlines |

One accent per beat. A card never uses green, amber and water as equal-weight decoration; one
of them is the argument, the others are support.

### Type

| Role | Face | Size |
|---|---|---|
| Dominant figure | Inter Black (copy-led) / Noto Sans Mono Bold (data-led) | 128–208 px |
| Card title | Inter Black | 54–78 px |
| Lead sentence | Inter Medium | 26–30 px |
| Body / note | Inter Regular | 19–25 px |
| Data label | Noto Sans Mono Bold | 14–20 px |
| Timecode / source | Noto Sans Mono | 12–16 px |
| Marathi line | Noto Sans Devanagari | 28 px |

Numerals are always mono so a figure reads as field data rather than marketing copy. The
product's Inter is used at every size; there is no second display face.

### Grid

1920 × 1080, 24 fps. Side margin 96 px. Header rule at y = 132, footer rule at y = 962. The
lower-third band is 170 px (paper on cards, forest on photographs). Cards are paper with a
faint dot grid and a static grain; photographs are full-bleed.

## Shot grammar

| Shot | Treatment |
|---|---|
| Card | PIL-rendered paper page. Elements arrive over 1.8 s, then the card holds. |
| Photograph | Full-bleed, graded, 2016 × 1134 source panned to 1920 × 1080 over the shot. |
| Document | Real build-sheet or circuit page on the left, three labelled takeaways on the right. |
| Screen | Dashboard or Probe Explorer captured in Demo Mode; no top chrome, so the UI stays readable. On dashboard captures the 170 px caption band never crosses baked UI: the capture is fitted to 1920 × 908 above the band on a forest panel. Explorer frames and deck visuals run full-frame with no film chrome at all — their words ("The problem", "How it senses") are already on the picture. |
| Face slate | Dark placeholder with the line, take number and framing note. Not a recorded take. |
| Clip | Gateway footage, scaled and cropped, with the same lower third as the stills. |

### Motion

- Card entrance: 0.45–0.7 s ease-out; counters run 0.9–1.4 s; list items stagger 60–220 ms.
- After 1.8 s the card holds a settled frame. No looping motion, no breathing backgrounds.
- Hard cuts inside a beat. A 0.16 s dip to black on both sides of every act boundary
  (0:25, 1:15, 1:45, 3:15, 3:50, 4:40, 5:40, 6:20, 6:45, 7:20).
- 0.6 s fade from black at the open and to black at the close.
- No cross-fades anywhere. The progress bar advances continuously; it is the only persistent
  motion in the frame.

### Photographs

`cover()` to 2016 × 1134, then `grade(warm=1.012, desat=0.04, lift=2)`. The extra 96 px of width
gives a slow lateral pan, alternating direction shot to shot. Chrome (wordmark, chapter,
source) is a separate transparent layer so it never pans with the picture.

## Card inventory

| Time | Card | Job | Source |
|---|---|---|---|
| 0:15–0:21 | Face take 1 | Hook, placeholder | To record |
| 0:21–0:25 | Title | Brand, promise, live URL | `theme.css`, Vercel |
| 0:38–0:50 | AWD numbers | One dominant −30 % water figure, −48 % methane and 51.3 Mha support rows | IRRI AWD, DA&FW 2024-25, as cited in the script |
| 0:57–1:15 | Three gaps | Hand-check, no record, radar depth | Round 1 deck, problem statement |
| 1:15–1:38 | Three layers, four stages | Ground → space → AI, then the two outputs | Product architecture |
| 3:15–3:18 | Face take 2 | Bench, placeholder | To record |
| 3:36–3:41 | Build sheet | Real page 1, pin map, power, connectors | `prototype-circuits/AGRI_GRID_Prototype_Build_Sheet.pdf` |
| 3:41–3:45 | Circuit | Real node diagram, sensing, radio, power | `prototype-circuits/png/hero.png` |
| 4:40–4:46 | Three models | Calibrate → detect → map, one track, three stops | Probe Explorer ch 17 |
| 5:05–5:17 | SAR triptych | VV in, U-Net prediction, hand label | Real checkpoint, Spain_7370579 |
| 5:17–5:25 | SAR metrics | 0.3817 mean IoU over 89 test chips, water IoU, precision, recall | Same checkpoint |
| 5:25–5:40 | Disagreement | Probe vs radar, agree or flag, never average | Round 1 evidence engine |
| 6:20–6:45 | Status | Built vs in build, simulated readings, next pilot | 8 Nov 2026 state |
| 6:45–6:57 | IPCC defaults | 140 kg vs 80 kg CH4 per hectare per season | IPCC defaults, as cited in the script |
| 6:57–7:03 | BOM | ₹14,995 stacked bar, six groups, V2 not costed | Round 1 deck, July 2026 BOM |
| 7:20–7:30 | Face take 3 | Close, placeholder | To record |
| 7:30–7:35 | End | URL, repo, QR, credits | Live deployment |

## Data rules

- **0.3817** is the mean IoU over 89 official-test chips at a fixed 0.50 threshold. **0.6209**
  is water IoU, **0.6927** precision, **0.8569** recall. **0.6136** is this one Spain chip.
  **0.4122 ± 0.0071** is the validation band, not a test result; it is labelled as such.
- The SAR triptych is the real U-Net checkpoint on `Spain_7370579`, a Sen1Floods11 official-test
  chip. The Surat p014 images are rule-based change detectors and are never presented as U-Net
  output.
- Probe readings and thresholds in the film are simulated and labelled. The dashboard is in
  Demo Mode; the badge stays visible.
- The BOM groups sum to ₹14,995: Heltec ₹8,800; power ₹2,950; sensors ₹1,545; enclosures ₹800;
  antennas ₹600; cables and misc ₹300.
- IPCC figures are defaults as cited in the script, not a measurement of this farm.
- The gateway clip is powered on throughout. The voice-over says "powered on"; there is no
  invented power cycle.
- The title and deck backgrounds are AI-generated concept visuals and are labelled.

## Borrowed patterns

The edit borrows design patterns, not a renderer. The sources:

| Pattern | Source | Use here |
|---|---|---|
| `Counter` | `digitalsamba/claude-code-video-toolkit` (`lib/components/DataChart.tsx`), MIT | Mono count-up for −30 %, 0.3817, ₹14,995 |
| `SplitBar` | Same file, MIT | Six-group stacked BOM bar |
| `BarChart` | Same file, MIT | Water IoU, precision, recall bars |
| `PageTurns` | `lib/components/PageTurns.tsx`, MIT | Document cards for the build sheet and circuit |
| `SlideTransition` | `lib/components/SlideTransition.tsx`, MIT | Hard cuts and act-boundary dips |
| `FilmGrain` | `lib/components/FilmGrain.tsx`, MIT | Static paper grain on cards only |
| Motion timings | `.opencode/skills/remotion/motion-craft.md`, adapted from HyperFrames (Apache-2.0) | 0.3–0.6 s moves, 40–80 ms staggers, short exits |
| One-accent data scenes | `.opencode/skills/video-design`, adapted from taste-skill (MIT) | Dominant figure, one accent, no KPI rows |

The toolkit's components are React/Remotion; this cut is PIL plus FFmpeg, so the patterns were
reimplemented for deterministic stills. Remotion itself is not used, so its company-size licence
does not apply to this render. The `remotion-dev/skills` repository has no LICENSE file; its
rules were read for motion guidance only and no code was copied.

## Render pipeline

```
build_film.py
  ├─ film_cards.py   → PIL card frames
  ├─ film_style.py   → palette, type, grade, chrome, lower third
  ├─ rawvideo pipe   → x264 for the first 1.8 s of each card
  ├─ last frame      → x264 hold for the rest of the shot
  ├─ ffmpeg          → still pans, clip trims, overlays, fades
  └─ concat          → 455.0 s, 10,920 frames, 1920×1080, 24 fps
```

Output: `AGRI-GRID-Round2-animatic-v2-1080p.mp4`, silent, 26 MB, H.264, `yuv420p`, BT.709
colour matrix, TV range, `+faststart`. The master carries one consistent stream tag, so
QuickTime-class players render the cards the same as VLC does.
The contact sheet is `AGRI-GRID-Round2-animatic-v2-contact-sheet.png`; it samples 25 key frames
from the finished file.

## Deliberate choices

- No cross-fades. The film cuts.
- No generic three-KPI row where a single dominant figure can carry the beat.
- No animated backgrounds, particles or AI video. The evidence is the visual.
- No false completeness: the face slates say `NOT A RECORDED TAKE`, the dashboard says
  `DEMO MODE`, and the SAR card says `REAL U-NET OUTPUT` only where that is true.
