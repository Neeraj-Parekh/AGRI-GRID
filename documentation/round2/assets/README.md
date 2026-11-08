# Round-2 asset packs

Extracted, ready-to-use packs for the video and the submission. Most are copies of material that
already existed elsewhere in the repo or in the supplied backups; the point of this folder is to
have one predictable path per asset instead of hunting through `claude/`,
`documentation/round2/cad/` and the Downloads folder.

## `prototype-circuits/`

Source of the 8-page **AGRI_GRID prototype build sheet** and every diagram in it.

```
diagrams.py                 theme-aware SVG generator (pure Python, no deps)
build_sheet.py              compiles the HTML build sheet and prints it to PDF
AGRI_GRID_Prototype_Build_Sheet.pdf
png/  probe · field · hero · perfboard · gateway · system
svg/  same six, vector, for slides and the website
```

Rebuild the drawings:

```bash
cd documentation/round2/assets/prototype-circuits
python3 diagrams.py out/          # writes the six SVGs
python3 build_sheet.py out/       # writes the HTML/PDF build sheet
```

These are the figures to use for the hardware beat: `png/probe.png` for the probe,
`png/perfboard.png` for the 70 × 90 board, `png/hero.png` for the station, `png/field.png`
for the deployment. Identical copies live in `claude/` (same md5), so either path is safe.

## `v2-freecad-package/`

The **V2 station** CAD, delivered by the Claude session. This is the large solar station
track, **not** the hero-node enclosure in `cad/hero-node-enclosure/`; keep the two separate
in the video and in any claim.

```
AGRI_GRID_V2_Assembly.FCMacro              parametric build macro
AGRI_GRID_V2_Assembly.step                 5.1 MB closed assembly
AGRI_GRID_V2_Assembly_ServiceView_CoverOff.step
AGRI_GRID_V2_BOM.csv                       bill of materials
AGRI_GRID_V2_MIV200_Plate_Drawing.pdf/.png 223 × 148 × 1.5 mounting plate
AGRI_GRID_V2_MIV200_Plate_Drill.dxf        laser/drill pattern
tools/agri_grid_export.py                  export helpers
preview_exterior_iso.png                   hero render for slides
preview_enclosure_front_cover_off.png      service view
README.md                                  the package's own notes
```

The assembly is a **concept model**: component envelopes are datasheet-derived where a
datasheet existed, and the package README records the open items (battery SKU, solar panel
SKU, ESP32 variant). It has not been printed or built. Do not present it as a tested station.

## `v2-manufacturer-resources.zip`

The **official manufacturer resource archive** named in the Claude transcript, 18.3 MB,
pulled from the CloudFront link on 2026-11-08 and integrity-checked (`unzip -t` clean).

```
00_README/                  source manifest, SHA256SUMS, component source register
01_Enclosure_Fibox/         MNX PC 200/150 HG STEP, DXF, datasheet, certificate
02_Controller_Espressif/    ESP32-DevKitC V4 dimension DXF/PDF, schematic, PCB layout
03_Radio_EBYTE/             E22-900M22S manual and footprint archives
04_Power_Genasun_Battery/   GV-5 charger data, battery candidate envelope
05_Sensors_DFRobot/         SEN0602, SEN0311/A02YYUW sheets
06_Solar_WAAREE/            panel data (plus the unresolved size conflict)
07_Reference_Links/         saved supplier pages
08_Regulators_Pololu/       D24V50F5 and D24V22Fx STEP/dimension data
09_RS485_DFRobot_DFR0845/   isolated RS485-to-UART drawing, schematic, datasheet
```

Use this pack only to substantiate a CAD claim on camera. Its `00_README/README.txt`
records the design holds: the WAAREE panel has two incompatible size listings, the EBYTE
module is solder-down, and the Fibox IP rating does not survive drilling for glands.

## `probe-stills/`

Twenty-one 1920 × 1080 paused frames from the Probe Explorer, captured with the laptop GPU and
the same `?ch=&t=&paused=1` links an editor can reproduce. Twelve of them were captured at the
exact timestamps the 7:35 script asks for; the rest cover chapters 1, 2, 3, 5, 7, 8, 10, 14 and
17. The frame labels (`Design render`, `Simulated data`, `Illustration`, `Literature`) are part
of the image and are meant to stay on screen. `ch10` still uses the labelled synthetic SAR pass;
the 7:35 script does not use it.

## `round1-deck/`

The recovered Round 1 submission deck, UTKARSH 1.0, 18 slides. `AGRI-GRID-UTKARSH-deck.pptx`
is the newer 13 Jul save; `AGRI-GRID-UTKARSH-deck.pdf` is the 12 Jul render; `slides/` holds
1600 px JPEGs of all 18 pages. Slide 14 is the **₹14,995** cost breakdown that the script's
"about fifteen thousand rupees" line refers to. This is the July prototype BOM (Heltec boards,
JSN-SR04T, IP65 boxes), not the V2 station. See its README for the slide map.

## `deck-visuals/`

Twelve 16:9 editorial backgrounds copied from the Round 1 deck assets, 1672 × 941 JPEGs. They
are **AI-generated visuals, not photographs**; label them `AI visual` if they appear as evidence.
Use them as backgrounds and add the text in the edit. The deck's `.pptx` text layer is still not
in the repo. See the README in that folder for a per-slide map.

## Provenance

| Pack | From | sha256 (archive) |
|---|---|---|
| `prototype-circuits/` | `AGRI_GRID_Prototype_Circuits (5).zip` | see the zip in `claude/`; files are byte-identical |
| `v2-freecad-package/` | `claude/AGRI_GRID_V2_FreeCAD_Package (1).zip` | `n/a` (extracted in place) |

The conversation that produced the V2 package is kept as
`documentation/round2/ClaudeAGRI_GRID_V2_transcript.txt`; the asset-by-asset map is
`documentation/round2/V2-TRANSCRIPT-ASSET-MAP.md`.
