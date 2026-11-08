# Round-2 asset packs

Two extracted, ready-to-use packs for the video and the submission. Both are copies of
material that already existed elsewhere in the repo or in the supplied backups; the point of
this folder is to have one predictable path per asset instead of hunting through `claude/`,
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

## Provenance

| Pack | From | sha256 (archive) |
|---|---|---|
| `prototype-circuits/` | `AGRI_GRID_Prototype_Circuits (5).zip` | see the zip in `claude/`; files are byte-identical |
| `v2-freecad-package/` | `claude/AGRI_GRID_V2_FreeCAD_Package (1).zip` | `n/a` (extracted in place) |

The conversation that produced the V2 package is kept as
`documentation/round2/ClaudeAGRI_GRID_V2_transcript.txt`; the asset-by-asset map is
`documentation/round2/V2-TRANSCRIPT-ASSET-MAP.md`.
