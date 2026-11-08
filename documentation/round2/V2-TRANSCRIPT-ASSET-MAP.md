# AGRI-GRID V2 - transcript asset map

**Source:** `documentation/round2/ClaudeAGRI_GRID_V2_transcript.txt` (56,799 bytes, 1,023 lines).
**Audit date:** 2026-11-08.
**Repo root:** `/mnt/20265E15265DEC72/study/CODE/HACKATHON/temp`.
**Method:** read the whole transcript; `find`/`grep` over the full repo (including `claude/`,
`documentation/round2/`, `documentation/round2/assets/`, `documentation/round2/cad/`,
`cad_models/` and hidden directories); `unzip -l` and `unzip -p ... | md5sum` on the
archives; `ls -l` on every path marked PRESENT. The only network check was a HEAD request
against the CloudFront URL named in the prompt.

Paths below are relative to the repo root unless written as absolute. Status key:

- **PRESENT** - at least one local copy verified with `ls`/`find`.
- **IN ZIP** - no repo copy, but a verified member of an archive that is present on disk.
- **MISSING** - no local copy found.
- **DUPLICATE** - not used as a primary status: duplicated assets are counted once under
  PRESENT and their byte-identical copies are listed in the path column and in §5.

## 1. What the conversation produced

The chat opens with a set of AI-generated hardware sheets (two named Reference PNGs plus
`1Untitled.png`...`5Untitled.png`) and a request for an exact, editable FreeCAD model. Claude refuses to treat the images as dimensioned truth, resolves a parts list
from manufacturer data (Fibox MNX PC 200/150 HG plus MIV 200 plate, Genasun GV-5-Li-14.2V,
Pololu D24V50F5 and D24V22F3, ESP32-DevKitC V4, EBYTE E22-900M22S, DFRobot DFR0845, SEN0602
and SEN0311, TE/Linx ANT-868-CW-HW-SMA, LAPP glands), and delivers a parametric `.FCMacro`
plus a STEP assembly, a BOM CSV, a MIV 200 drill DXF/PDF, two renders, a README and an
export/collision script. It then builds a separate hero-probe and field-node prototype pack
(a 10-page build sheet, six circuit diagrams, a perfboard layout), produces a static
"AGRI-GRID V2 Field Station" HTML artifact, and closes with recording advice for the probe
website. The transcript mixes two layers: lines 70-838 are a pasted ChatGPT engineering brief
with a Phase 9 deliverables list, while Claude's actual output starts around line 905. Several
files in that Phase 9 list were specification, not delivered files. The package is a concept
model: the macro was never executed in real FreeCAD in that workspace (it was tested against a
stand-in), the battery, solar panel and sensor bodies are PROXY envelopes, and the station has
not been built or field-tested.

## 2. Asset table

### A. Reference images and prior-round inputs

These are the files the user or the pasted brief told Claude to find. The images are inputs to
the conversation, not outputs; Claude used them as layout intent only. The reconciliation file
calls the set "five sheets" but names seven image files; all seven are listed separately here.

| Asset | Role in the conversation | Local path or archive member | Status |
|---|---|---|---|
| `AGRI_GRID_V2_Enclosure_Internal_Reference.png` | One of the AI-generated hardware sheets; interior layout authority for the station. Claude explicitly refused to trust its dimensions and used datasheets instead. | No repo copy. Named in transcript line 2 and in `documentation/round2/AGRI-GRID-V2-REFERENCE-RECONCILIATION.md` (scope). | MISSING |
| `AGRI_GRID_V2_Exterior_Reference.png` | Exterior layout sheet from the same set; reference only. | No repo copy. Named in transcript line 3. | MISSING |
| `1Untitled.png` | One of the additional AI-generated hardware sheets (`1Untitled`...`5Untitled`). | No repo copy. Named in transcript line 8. | MISSING |
| `2Untitled.png` | Same reference-sheet set. | No repo copy. Named in transcript line 7. | MISSING |
| `3Untitled.png` | Same reference-sheet set. | No repo copy. Named in transcript line 6. | MISSING |
| `4Untitled.png` | Same reference-sheet set. | No repo copy. Named in transcript line 5. | MISSING |
| `5Untitled.png` | Same reference-sheet set. | No repo copy. Named in transcript line 4. | MISSING |
| `AGRI_GRID_V2_Component_CAD_Register_v0.5.xlsx` | Prior component/CAD register that Claude was told to locate and read before rebuilding anything. | No `.xlsx` exists in the repo. Nearest analog: `AGRI-GRID-V2-COMPONENT-REGISTER.md` (17,876 B) plus its `CONTEXT-PACK/01-project-core/` copy; different format and filename. | MISSING |
| `AGRI_GRID_V2_Local_Agent_Handoff_v0.5.md` | Prior agent handoff note named in the brief. | No repo copy. No file named `*Handoff*` was found. | MISSING |
| `AGRI_GRID_V2_Round2_Implementation_Pack.zip` | Prior round-2 implementation archive named in the brief. | No repo copy. Not inside the two repo audit zips either. | MISSING |
| `AGRI_GRID_V2_R2_Reference_Assembly_Deployed.step` | Prior deployed reference assembly named in the brief. | No repo copy. Nearest model: `documentation/round2/cad/master_v5/AGRI-GRID-V2-MASTER.step` (2,882,642 B, md5 `de1f75f1706b88d1c6694a6eed826943`), but that is the repo's own master, not the named R2 file. | MISSING |
| `AGRI_GRID_V2_Official_CAD_Datasheets_Final_20261016.zip` | Manufacturer CAD/datasheet archive named in the brief, with a CloudFront download URL. | No repo copy. The URL in transcript line 146 still returns HTTP 200: 18,271,018 B, Last-Modified 2026-10-16 18:23:49. It was not downloaded for this audit. | MISSING |
| `AGRI_GRID_V2_FreeCAD_Engineering/` (00_References ... 09_Final_Deliverables) | Prescribed working directory tree for the CAD job. | No such directory exists. The delivered package is flat under `documentation/round2/assets/v2-freecad-package/`. | MISSING |

### B. V2 station CAD package (Claude's main output)

This is the large solar-mast station track, not the hero node. All files below were delivered
by the Claude session and are concept/CAD material, not tested hardware.

| Asset | Role in the conversation | Local path or archive member | Status |
|---|---|---|---|
| `AGRI_GRID_V2_Assembly.FCMacro` | Main editable deliverable. Parametric FreeCAD macro that builds the 147-named-part / 8-subassembly station, plus `Params` and `BOM` spreadsheets. Claude never ran it in real FreeCAD. | `documentation/round2/assets/v2-freecad-package/AGRI_GRID_V2_Assembly.FCMacro` (48,921 B, md5 `24c757c4fa16bb2f9fb982cf52c75925`). Identical copies: `claude/AGRI_GRID_V2_Assembly.FCMacro` and `claude/AGRI_GRID_V2_Assembly (1).FCMacro`; zip member `AGRI_GRID_V2/AGRI_GRID_V2_Assembly.FCMacro`. | PRESENT |
| `AGRI_GRID_V2_Assembly.step` | Same assembly as a STEP AP214 assembly (148 named, coloured products); the fixed-solid version of the model. | `documentation/round2/assets/v2-freecad-package/AGRI_GRID_V2_Assembly.step` (5,109,237 B, md5 `7716b97bdad02ea315938f5815ef7112`). Identical copies: two files in `claude/` (plain and `(1)`); zip member. | PRESENT |
| `AGRI_GRID_V2_Assembly_ServiceView_CoverOff.step` | The "version with the cover pulled off" mentioned in the prose; cover moved 260 mm forward to expose the interior. | `documentation/round2/assets/v2-freecad-package/AGRI_GRID_V2_Assembly_ServiceView_CoverOff.step` (5,102,415 B, md5 `00118e394c74765cd0edef2c0a897c8c`); zip member `AGRI_GRID_V2/AGRI_GRID_V2_Assembly_ServiceView_CoverOff.step`. | PRESENT |
| `AGRI_GRID_V2_MIV200_Plate_Drill.dxf` | 1:1 drill/laser template for the Fibox MIV 200 mounting plate, front view in mm. | `documentation/round2/assets/v2-freecad-package/AGRI_GRID_V2_MIV200_Plate_Drill.dxf` (8,475 B, md5 `8c1712d1d38dfdf7ca0600f6f614fd6f`); zip member `AGRI_GRID_V2/AGRI_GRID_V2_MIV200_Plate_Drill.dxf`. | PRESENT |
| `AGRI_GRID_V2_MIV200_Plate_Drawing.pdf` | One-page plate layout and hole table; the "miv200 plate drawing" PDF attachment. | `documentation/round2/assets/v2-freecad-package/AGRI_GRID_V2_MIV200_Plate_Drawing.pdf` (36,347 B, md5 `893f8b8244ccce3a299cba9c1d354882`). Identical copies: `claude/AGRI_GRID_V2_MIV200_Plate_Drawing.pdf` and `claude/AGRI_GRID_V2_MIV200_Plate_Drawing (1).pdf`; zip member. | PRESENT |
| `AGRI_GRID_V2_MIV200_Plate_Drawing.png` | Raster sibling of the plate drawing (1240 x 1753). | `documentation/round2/assets/v2-freecad-package/AGRI_GRID_V2_MIV200_Plate_Drawing.png` (133,839 B, md5 `75598988f358a3b9e71e49384941c29c`); zip member `AGRI_GRID_V2/AGRI_GRID_V2_MIV200_Plate_Drawing.png`. | PRESENT |
| `AGRI_GRID_V2_BOM.csv` | Bill of materials (55 lines: header plus 54 items) with manufacturer, part number, status and source. This is the only BOM file delivered. | `documentation/round2/assets/v2-freecad-package/AGRI_GRID_V2_BOM.csv` (6,864 B, md5 `6086165bd444f58da57761c014566435`); zip member `AGRI_GRID_V2/AGRI_GRID_V2_BOM.csv`. | PRESENT |
| `preview_exterior_iso.png` | Exterior render of the full station with a translucent 60-degree ultrasonic field-of-view cone. | `documentation/round2/assets/v2-freecad-package/preview_exterior_iso.png` (166,886 B, md5 `6dee87ade5a60c4dc42d737e4e1e6b28`). Identical copies: `claude/preview_exterior_iso.png` and `claude/preview_exterior_iso (1).png`; zip member. | PRESENT |
| `preview_enclosure_front_cover_off.png` | Front elevation of the internal plate with the cover removed. | `documentation/round2/assets/v2-freecad-package/preview_enclosure_front_cover_off.png` (60,836 B, md5 `dc9ee32d31dd7415aa535e9e650f5b14`). Identical copies: `claude/preview_enclosure_front_cover_off.png` and `... (1).png`; zip member. | PRESENT |
| `README.md` (package README) | Sources, open questions, verification results, design holds and vendor-CAD swap instructions; the de facto verification log. | `documentation/round2/assets/v2-freecad-package/README.md` (8,772 B, md5 `d73a77de57ef84de559f3b56bf3330d5`); zip member `AGRI_GRID_V2/README.md`. | PRESENT |
| `tools/agri_grid_export.py` | Script that regenerates the STEP, BOM, DXF, renders and collision check from the macro without FreeCAD. | `documentation/round2/assets/v2-freecad-package/tools/agri_grid_export.py` (28,457 B, md5 `d130ff57d2c601eeee6dfdb932e6b36e`); zip member `AGRI_GRID_V2/tools/agri_grid_export.py`. | PRESENT |
| `AGRI_GRID_V2_FreeCAD_Package (1).zip` | The "Agri grid v2 freecad package" ZIP attachment. 11 files, 10,711,049 B uncompressed. | `claude/AGRI_GRID_V2_FreeCAD_Package (1).zip` (2,290,460 B). Its full extracted copy is `documentation/round2/assets/v2-freecad-package/`; there is no unnumbered ZIP in the repo. | PRESENT |
| `AGRI_GRID_V2_BOM.xlsx` | Excel BOM requested in the pasted brief's Phase 8/9. | No `.xlsx` exists. Only the CSV above; the macro creates an in-document `BOM` spreadsheet when run. | MISSING |
| `AGRI_GRID_V2_Manufacturer_CAD_Manifest.csv` | Source/provenance manifest requested in Phases 2 and 9. | No CSV. The package README carries the source links, but there is no manifest file. | MISSING |
| `AGRI_GRID_V2_Source_and_Verification_Log.md` | Requested research and verification log. | No such file. Sources are in the package README. | MISSING |
| `AGRI_GRID_V2_Design_Holds_and_Risks.md` | Requested design-holds and risk register. | No such file. The README's "Design holds" section is the only version. | MISSING |
| `AGRI_GRID_V2_Collision_Report.md` | Requested collision report. | No such file. The README records "0 clashes"; `tools/agri_grid_export.py` prints the collision result to stdout rather than writing a report. | MISSING |
| `AGRI_GRID_V2_Electrical_and_Environmental_Checklist.md` | Requested electrical and environmental checklist. | No such file. The README has a short "Electrical" note and a sealing note. | MISSING |
| `AGRI_GRID_V2_Master_Assembly.FCStd` | The editable FreeCAD document the user was told to save after running the macro. | No file. There is no FCStd from this package. The repo's separate station master `documentation/round2/cad/master_v5/AGRI-GRID-V2-MASTER.FCStd` (526,831 B) is a different 150-object, landscape model. | MISSING |
| `AGRI_GRID_V2_Complete_Assembly.step` | The Phase 9 name for the complete assembly STEP. | No file under that name. The equivalent delivered file is `AGRI_GRID_V2_Assembly.step`. | MISSING |
| `AGRI_GRID_V2_Exploded_Assembly.step` | The Phase 9 name for an exploded/separated assembly STEP. | No file. Only the cover-off service view exists; there is no exploded configuration. | MISSING |

### C. Hero-node / probe prototype and website material

These are the separate prototype track: the 3D-printed probe node, the ESP-NOW field nodes,
the circuits and the probe website. They are not the V2 station CAD.

| Asset | Role in the conversation | Local path or archive member | Status |
|---|---|---|---|
| `AGRI_GRID_Prototype_Build_Sheet.pdf` ("Agri grid prototype build sheet") | 10-page A4 build sheet: system, hero schematic, perfboard, field nodes, gateway, probe drawing, calibration and parts. | `documentation/round2/assets/prototype-circuits/AGRI_GRID_Prototype_Build_Sheet.pdf` (616,008 B, md5 `850f0e61f8eab8f13b26581d68395e4d`, 10 pages). Identical copies: `claude/AGRI_GRID_Prototype_Build_Sheet (5).pdf`, `websites/2026-11-08-probe-explorer/documentation/probe-sources/AGRI_GRID_Prototype_Build_Sheet.pdf`; zip member. | PRESENT |
| `AGRI_GRID_Prototype_Circuits.zip` ("Agri grid prototype circuits") | 15-file circuit pack: six PNGs, six SVGs, two generator scripts, the build-sheet PDF. | `claude/AGRI_GRID_Prototype_Circuits (5).zip` (1,400,002 B; 15 files / 1,721,941 B uncompressed). Full extracted copy: `documentation/round2/assets/prototype-circuits/`. Member prefix `AGRI_GRID_Prototype_Circuits/`. | PRESENT |
| `hero.png` | Hero-node circuit diagram: ESP32 DevKit V1, 11-pin probe cable, SHT31, INA219, TP4056, HT7833 and battery divider. | `documentation/round2/assets/prototype-circuits/png/hero.png` (150,320 B, md5 `4c9cf4d9b44e2ec8431699dcabd04bd9`). Identical copies: `claude/hero (5).png`, `websites/2026-11-08-probe-explorer/documentation/probe-sources/png/hero.png`; zip member. | PRESENT |
| `perfboard.png` | 7 x 9 cm perfboard layout, 24 x 30 holes, component-side view; script-checked for shorts and unconnected nets. | `documentation/round2/assets/prototype-circuits/png/perfboard.png` (221,074 B, md5 `8b9991c0fa2139a77b046a31251d414b`). Identical copies: `claude/perfboard (5).png`, the website probe-sources PNG; zip member. | PRESENT |
| Circuit diagram set: `probe`, `field`, `gateway`, `system` (PNG and SVG) | The remaining diagrams in the build sheet and the circuits ZIP; "in the zip as SVG and PNG". | `documentation/round2/assets/prototype-circuits/png/{probe,field,gateway,system}.png` and `.../svg/{probe,field,gateway,system}.svg` (plus `hero`/`perfboard`); zip members under `AGRI_GRID_Prototype_Circuits/png/` and `.../svg/`. | PRESENT |
| `probe-scenes-preview.jpg` | "Probe scenes preview - JPG" review contact sheet for the probe-explorer scenes. | `websites/2026-11-08-probe-explorer/review/probe/probe-scenes-preview.jpg` (665,047 B, 1990 x 1604), restored from the `review/` folder of `AGRI-GRID-probe-explorer.zip`. | PRESENT |
| `AGRI-GRID V2 Field Station.html` ("Artifact") | Static single-page Field Station instrument; the attachment card in the chat. It contains the Prototype model and Circuits viewer described in the prose. | `claude/AGRI-GRID V2 Field Station (1).html` (244,896 B). The maintained Vite source is `websites/2026-11-08-probe-explorer/`; it is a later app, not byte-identical to this static artifact. | PRESENT |
| `frontend/public/media/sar/surat.jpg` | Team's Surat Sentinel-1 SAR figure for chapter 16 of the probe story. Without it, the panel shows a labelled synthetic placeholder. | No copy. `websites/2026-11-08-probe-explorer/frontend/public/media/` contains only `README.md`; there is no `media/sar/` directory. No `surat*` file was found anywhere in the repo. | MISSING |
| `RECORDING.md` | Recording guide: chapter map, keys, still-frame links, pre-record checklist and the Surat-image requirement. | `websites/2026-11-08-probe-explorer/frontend/src/probe/RECORDING.md` (3,204 B). | PRESENT |

## 3. Counts

| Status | Count |
|---|---:|
| PRESENT | 20 |
| IN ZIP | 0 |
| MISSING | 23 |
| **Total named assets** | **43** |

Duplicates are counted once under PRESENT. No V2-package or circuits-zip member is zip-only:
both archives are fully extracted under `documentation/round2/assets/`. `probe-scenes-preview.jpg`
was the only IN ZIP row; it was copied out of the external probe-explorer archive after the
audit and is now PRESENT.

## 4. What to pull next, ordered by value for the final video

1. **`frontend/public/media/sar/surat.jpg` (missing, highest value).** This is the only missing
   file that changes a rendered chapter. Chapter 16 currently falls back to a labelled
   synthetic placeholder. Get the team's Surat SAR figure, crop to roughly 16:8, and put it at
   `websites/2026-11-08-probe-explorer/frontend/public/media/sar/surat.jpg`. No local source
   was found, so this must come from the team or the original Copernicus product.
2. **`probe-scenes-preview.jpg` (done).** Copied out of `AGRI-GRID-probe-explorer.zip` to
   `websites/2026-11-08-probe-explorer/review/probe/probe-scenes-preview.jpg`; it is a contact
   sheet for shot selection, not an app asset.
3. **Editable/exploded V2 station, only if the CAD beat uses the station.** Neither
   `AGRI_GRID_V2_Master_Assembly.FCStd` nor `AGRI_GRID_V2_Exploded_Assembly.step` exists. Run
   `AGRI_GRID_V2_Assembly.FCMacro` in FreeCAD and save the FCStd, or explode the delivered STEP
   in Blender. If the edit follows `VIDEO-PACKAGE-INDEX.md`, the enclosure beat already has the
   five hero-node renders in `documentation/round2/cad/hero-node-enclosure/renders/`; use those
   and do not build a new station shot just for the deadline.
4. **`AGRI_GRID_V2_BOM.xlsx` (missing, low-medium).** The 55-line CSV is complete and readable.
   Generate an XLSX only if a spreadsheet is going on screen; otherwise the CSV or a styled
   table is enough.
5. **`AGRI_GRID_V2_Official_CAD_Datasheets_Final_20261016.zip` (missing, medium for claims,
   low for pictures).** The URL is still live at 18.3 MB. Pull it if you need to substantiate
   "manufacturer CAD" on camera; the package README's source links are enough for a CAD
   concept beat.
6. **The seven reference images (missing, low for video, high for reconciliation).** Only worth
   recovering if you plan a "reference vs CAD" side-by-side. The reconciliation Markdown
   already records what each sheet showed and where it was wrong.
7. **The six missing reports/manifests and the prior-round files (missing, not worth pulling
   before the deadline).** `AGRI_GRID_V2_Manufacturer_CAD_Manifest.csv`,
   `..._Source_and_Verification_Log.md`, `..._Design_Holds_and_Risks.md`,
   `..._Collision_Report.md`, `..._Electrical_and_Environmental_Checklist.md`,
   `..._BOM.xlsx`, the old component register/handoff, `..._Round2_Implementation_Pack.zip` and
   `..._R2_Reference_Assembly_Deployed.step` add no shot. The substantive results are in the
   package README and the separate `master_v5` model. The unused Phase 9 names
   `AGRI_GRID_V2_Complete_Assembly.step` and `AGRI_GRID_V2_Exploded_Assembly.step` are similarly
   skippable; `AGRI_GRID_V2_Assembly.step` and the service view already cover the geometry.
8. **Printable probe STL and firmware (never delivered, only if the script promises them).**
   Claude offered both at the end but produced neither, and neither has a filename in the
   transcript. The hero-node enclosure STLs and renders exist separately under
   `documentation/round2/cad/hero-node-enclosure/`; do not claim a printed probe or running
   firmware unless those artifacts are actually produced and tested.

## 5. Duplicate ledger (identical size and md5)

Verified with `md5sum`; package ZIP members were compared with `unzip -p ... | md5sum`.

- `AGRI_GRID_V2_Assembly.FCMacro` - 48,921 B, md5 `24c757c4fa16bb2f9fb982cf52c75925`:
  `claude/` plain and `(1)` copies, the `assets/v2-freecad-package/` copy, and the ZIP member.
- `AGRI_GRID_V2_Assembly.step` - 5,109,237 B, md5 `7716b97bdad02ea315938f5815ef7112`:
  `claude/` plain and `(1)` copies, the `assets/v2-freecad-package/` copy, and the ZIP member.
- `AGRI_GRID_V2_MIV200_Plate_Drawing.pdf` - 36,347 B,
  md5 `893f8b8244ccce3a299cba9c1d354882`: `claude/` plain and `(1)` copies, the assets copy,
  and the ZIP member.
- `preview_exterior_iso.png` - 166,886 B, md5 `6dee87ade5a60c4dc42d737e4e1e6b28`:
  `claude/` plain and `(1)` copies, the assets copy, and the ZIP member.
- `preview_enclosure_front_cover_off.png` - 60,836 B,
  md5 `dc9ee32d31dd7415aa535e9e650f5b14`: `claude/` plain and `(1)` copies, the assets copy,
  and the ZIP member.
- `AGRI_GRID_Prototype_Build_Sheet.pdf` - 616,008 B,
  md5 `850f0e61f8eab8f13b26581d68395e4d`: `claude/AGRI_GRID_Prototype_Build_Sheet (5).pdf`,
  the `assets/prototype-circuits/` copy, the website `probe-sources/` copy, and the circuits
  ZIP member.
- `hero.png` - 150,320 B, md5 `4c9cf4d9b44e2ec8431699dcabd04bd9`:
  `claude/hero (5).png`, `assets/prototype-circuits/png/hero.png`, the website
  `probe-sources/png/hero.png`, and the circuits ZIP member.
- `perfboard.png` - 221,074 B, md5 `8b9991c0fa2139a77b046a31251d414b`:
  `claude/perfboard (5).png`, `assets/prototype-circuits/png/perfboard.png`, the website
  `probe-sources/png/perfboard.png`, and the circuits ZIP member.
- The V2 package folder and `AGRI_GRID_V2_FreeCAD_Package (1).zip` match for all 11 files:
  FCMacro, both STEPs, BOM CSV, drawing PDF/PNG, drill DXF, both previews, README and
  `tools/agri_grid_export.py` (md5s `00118e39...`, `6086165b...`, `75598988...`,
  `8c1712d1...`, `d73a77de...`, `d130ff57...` for the additional members).
- The circuits ZIP and `assets/prototype-circuits/` carry the same 15 files; all 15 were
  md5-compared member-by-member and are byte-identical.

## 6. V2 station CAD versus hero-node / probe material

**V2 station CAD (separate track).** Section A and Section B belong to the solar-mast
station: Fibox enclosure, MIV 200 plate, battery, charger, regulators, mast, panel, radiation
shield, water sensor, soil probe and antenna. This is a concept assembly, not the hero node,
and it was never built or tested. It also differs in orientation from the repo's separate
station master: Claude's model is portrait (180 mm wide x 255 mm tall), while
`documentation/round2/cad/master_v5/AGRI-GRID-V2-MASTER.FCStd` is landscape (255 wide x 180
tall). Do not cut between the two as if they were the same station.

**Hero-node / probe material (the video's hardware story).** Section C belongs to the
3D-printed probe node, the ESP-NOW field nodes, the gateway, the circuits and the `/probe`
website. The recommended enclosure shots are the five hero-node renders under
`documentation/round2/cad/hero-node-enclosure/renders/`; `hero.png` and `perfboard.png` are
circuit diagrams from this track, not enclosure renders. The `AGRI-GRID V2 Field Station.html`
artifact and the `websites/2026-11-08-probe-explorer/` source are the software/probe narrative,
not station CAD.

**Naming traps.** `AGRI_GRID_V2_Master_Assembly.FCStd` (missing; Claude's save target) is not
`AGRI-GRID-V2-MASTER.FCStd` (present; the repo's separate 150-object station master).
`AGRI_GRID_V2_Assembly.step` is the Claude station, not the hero node. `hero.png` is a circuit
diagram, not a hero-node enclosure render. The official Fibox support files are present under
different names: `documentation/round2/cad/6011329-fibox-mnx-pc-200-150-hg.step` (1,611,697 B)
and `documentation/round2/cad/5514080-fibox-miv200.step` (146,121 B), with `.txt` sidecars
recording URL, licence and kernel check. Those are station-track vendor geometry, not part of
the Claude package, and they mean the "Fibox STEP needs a login" hold in the transcript is
already covered locally.
