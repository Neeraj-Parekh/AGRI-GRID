# AGRI-GRID — final video asset index

One place to collect everything the video needs: the running website, the CAD, and the
idea/pitch material. Each row says where the file is, what it actually is, and whether it
is ready to film.

**For the 7:35 Round 2 script, use `VIDEO-SHOT-MAP.md`** — it maps every line of
`VIDEO-SCRIPT.md` to an asset, a URL and a status. This page is the wider inventory.

**Rule for the edit:** every shot is labelled with its source. A render is not a photo of
a built part; a demo-mode chart is not live field data. Put the label in the corner of the
shot or in the voice-over, and keep it consistent.

## 1. Story beats

| # | Beat | What the viewer must take away |
|---|---|---|
| 1 | Problem | Paddy fields are over-watered; the decision is made without evidence |
| 2 | Idea | A node measures water, soil and air, and the app shows the evidence behind an alert |
| 3 | System | Node → gateway → app, with each number carrying its source and time |
| 4 | Hardware | The node, the enclosure, and what is still a prototype |
| 5 | Software | The app running, with demo and live data visibly separated |
| 6 | Proof | What has been tested, what has not, and what happens next |

## 2. Website (software)

Three sites are served from the laptop. `websites/README.md` has the full inventory,
provenance and Vercel settings; `agri-sites/start-all.sh` starts all four servers.

| # | Site | Local URL | Source | Status |
|---|---|---|---|---|
| 1 | AGRI-GRID website + Probe Explorer, 8 Nov build | http://localhost:5173/ | `AGRI-GRID-probe-explorer.zip` | story home + dashboard + 18-chapter probe; canonical |
| 2 | Previous build, 4 Nov | http://localhost:5174/ | `agri-grid-website-backup.zip` | rollback only, no `/probe` |
| 3 | Yenprotek offline mirror | http://localhost:8090/en/index.html | `yenprotek-offline.zip` | reference only, **never publish** |
| — | Landing page for all three | http://localhost:8080/ | `agri-sites/landing/` | bookmark / thumbnail source |

| Asset | Path | Status |
|---|---|---|
| Latest source snapshot | `websites/2026-11-08-probe-explorer/` | runnable Vite app, probe included |
| API | `backend/agri_api.py` | FastAPI adapter, in-memory store, port 8001 |
| Run guide + demo path | `README-AGRI-GRID-WEBSITE.md` | 2-minute walkthrough and the curl ingest for a live badge |
| GitHub Pages (older) | https://Neeraj-Parekh.github.io/AGRI-GRID/ | built from commit `15b3840`, 2 Nov; behind the local builds |
| Recorded screenshots | `agri-sites/screenshots/` | landing, AGRI-GRID home, dashboard, Yenprotek |
| Vercel deployment | https://agri-grid-chi.vercel.app | live 8 Nov build; runbook `documentation/round2/DEPLOY-VERCEL.md` |

Routes worth filming: `/` story home, `/dashboard`, `/fields`, `/fields/AGRI-001`,
`/intelligence` (detect / infer / predict), `/evidence` (two records, one consistent and one
flagged), `/hardware`, `/reports`, and `/probe` for the hardware story.

The pour-water chain in the run guide is the strongest shot: post one packet with `curl`,
then show the same node in the app with a LIVE badge. Demo Mode is labelled SIMULATED and
must stay labelled that way on screen.

### Probe Explorer shot links

| What | Link |
|---|---|
| Whole story, recording frame | http://localhost:5173/probe?record=1 |
| One chapter, paused | http://localhost:5173/probe?record=1&ch=5&t=12&paused=1 |
| Lower GPU load | http://localhost:5173/probe?record=1&quality=low |
| Field hardware variant | http://localhost:5173/probe?record=1&variant=field |
| Marathi interface | http://localhost:5173/probe?record=1&lang=mr |

The chapter map and recording keys are in
`websites/2026-11-08-probe-explorer/frontend/src/probe/RECORDING.md`. The page is GPU-heavy:
record it in a normal Chrome window with hardware acceleration, not in a headless browser.

## 3. CAD and renders

| Asset | Path | Status |
|---|---|---|
| Hero-node enclosure, 5 renders | `cad/hero-node-enclosure/renders/` | Cycles renders of the exported STL; **not a printed part** |
| Hero-node source + STLs | `cad/hero-node-enclosure/` | checked, manifold, openings ray-verified |
| Candidate gallery | `cad/external_candidates/enclosures/GALLERY.html` | comparison of four generators plus the chosen build |
| P1 station renders | `cad/printed/renders/` | 6 FreeCAD/Blender renders of the P1 module |
| P1 drawings | `cad/printed/drawings/` | dimensioned PDF/PNG/SVG drawings |
| V2 station assembly | `claude/AGRI_GRID_V2_Assembly.step` | large concept assembly, **not** the hero node; keep the two apart |
| Blender scenes | `models/agri-grid-node*.blend` | earlier node visualisations |

For the enclosure beat, use `hero_render_asm.png` (closed), `hero_render_open.png` (cells
and tray), `hero_render_exploded.png` (lid, board, base) and `hero_render_detail.png`
(USB slot and vent). The back view shows the M12 gland. Do not cut to a photo of a printed
box: there isn't one yet.

## 4. Idea / pitch material

| Asset | Path | Status |
|---|---|---|
| Submission brief | `documentation/round2/AGRI-GRID-SUBMISSION-PACKAGE.md` | current, 27 Oct, with the hero-node row updated |
| Concept note | `AGRI-GRID-CONCEPT-NOTE.md` | short framing text |
| Build plan / research | `AGRI-GRID-BUILD-PLAN.md`, `documentation/round2/*` | long-form backing |
| Deck prompt | `AGRI-GRID-PPT-PROMPT.md` | a prompt for a deck, **not a deck** |
| Deck | `documentation/round2/assets/round1-deck/` | **found**: 18-slide UTKARSH 1.0 PPTX, PDF and slide JPEGs; ₹14,995 cost card on slide 14 |
| One-page site mock | `claude/AGRI-GRID V2 Field Station (1).html` | static single-page mock |
| Build sheet | `claude/AGRI_GRID_Prototype_Build_Sheet (5).pdf` | wiring, pin map, probe geometry, 10 pages |
| Build-sheet source | `documentation/round2/assets/prototype-circuits/` | `diagrams.py` + PNG/SVG of probe, field, hero, perfboard, gateway, system |
| Perfboard layout | `claude/perfboard (5).png` / `documentation/round2/assets/prototype-circuits/png/perfboard.png` | 70 × 90 board layout |
| Hero diagram | `claude/hero (5).png` / `documentation/round2/assets/prototype-circuits/png/hero.png` | probe + station hero art |
| V2 design transcript | `documentation/round2/ClaudeAGRI_GRID_V2_transcript.txt` | the Claude CAD conversation, for provenance |
| Transcript asset map | `documentation/round2/V2-TRANSCRIPT-ASSET-MAP.md` | 43 named assets: 21 present, 22 missing, pull order |
| Manufacturer resources | `documentation/round2/assets/v2-manufacturer-resources.zip` | Fibox/ESP32/EBYTE/Genasun/DFRobot source CAD and datasheets |
| Probe scene contact sheet | `websites/2026-11-08-probe-explorer/review/probe/probe-scenes-preview.jpg` | 1990 × 1604 sheet of the probe chapters, for shot selection |
| Deck visuals, 12 backgrounds | `documentation/round2/assets/deck-visuals/` | 1672 × 941 AI editorial visuals, **not photographs**; later redesign, not the 18-slide deck |
| Probe stills, 1080p | `documentation/round2/assets/probe-stills/` | twenty-one paused frames; twelve match script timestamps, reproducible links in its README |
| Gateway prototype clip | `documentation/round2/assets/hardware/` | 33 s phone clip on a 1080p canvas, internals close-up, LED and ESP32 bench stills |
| SAR triptych and metrics card | `documentation/round2/assets/sar/` | real U-Net output on one Spain test chip (IoU 0.61), plus the 89-chip 0.3817 card |

## 5. Missing before the edit

1. A screen recording in Live Mode (the sites are running locally; GitHub Pages is the older
   public build, so record from `localhost:5173` and say it is the local build).
2. A decision on whether the `[DECK sNN]` slides use the recovered UTKARSH deck
   (`assets/round1-deck/`) or the later editorial backgrounds (`assets/deck-visuals/`).
3. One clean audio take of the 90-second narration (script can come from beats 1-6 above).
4. A shot of the real parts laid out (ESP32, cells, modules, perfboard) — that is a phone
   photo, not CAD.
5. Caption/legend graphics: `LIVE`, `DEMO`, `CAD`, `NOT YET BUILT`.

## 6. Suggested running order (about 2:30)

| Time | Shot | Source |
|---|---|---|
| 0:00 | Field / problem stills | phone or stock, needs a licence note |
| 0:15 | App overview | screen recording, Demo Mode, badge visible |
| 0:35 | Field page, node B2, 4 cm drop | screen recording |
| 0:50 | Pour-water packet → LIVE badge | curl + app, one take |
| 1:05 | Intelligence page | screen recording |
| 1:18 | Probe Explorer: chapters 2–5 | `/probe?record=1&ch=2`, 20 s |
| 1:38 | Enclosure: closed → open → exploded | the five renders |
| 1:55 | Parts on the bench | phone photo/video |
| 2:10 | What is tested / what is not | caption card |
| 2:20 | Close on the app's evidence idea | screen recording |

The honesty beat at 2:10 is not optional: the enclosure is CAD, the probe is uncalibrated,
and the station is not built. Say so before a judge asks.
