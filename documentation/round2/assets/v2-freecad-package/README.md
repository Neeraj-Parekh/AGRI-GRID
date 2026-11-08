# AGRI-GRID V2 — FreeCAD model package (Round 2, fixed mast)

## Files
| File | What it is |
|---|---|
| `AGRI_GRID_V2_Assembly.FCMacro` | **Main deliverable.** Parametric FreeCAD macro. Builds the full station (147 named parts in 8 sub-assemblies) plus `Params` and `BOM` spreadsheets. |
| `AGRI_GRID_V2_Assembly.step` | Same model as a STEP AP214 assembly (148 named, coloured products). Opens in FreeCAD, Fusion, SolidWorks, Onshape. |
| `AGRI_GRID_V2_Assembly_ServiceView_CoverOff.step` | Same, with the enclosure cover pulled 260 mm forward so the interior is visible. |
| `AGRI_GRID_V2_MIV200_Plate_Drill.dxf` | 1:1 drill template for the Fibox MIV 200 plate (front view, mm). Layers: holes by diameter, slots, component outlines. |
| `AGRI_GRID_V2_MIV200_Plate_Drawing.pdf/.png` | Plate layout drawing with hole table. |
| `AGRI_GRID_V2_BOM.csv` | Bill of materials with manufacturer, part number, verification status and source. |
| `preview_*.png` | Renders of the exterior and of the enclosure interior with the cover off. |
| `tools/agri_grid_export.py` | Regenerates STEP, BOM, DXF, renders and the collision check from the macro (plain Python + numpy, no FreeCAD needed). |

## Open it in FreeCAD (0.21, 1.0, 1.1)
1. Macro → Macros… → set the folder to this one → select `AGRI_GRID_V2_Assembly.FCMacro` → **Execute**.
2. Save the result as `AGRI_GRID_V2_Master_Assembly.FCStd`.
3. **Tuning:** open the `Params` spreadsheet, change any value in column B (e.g. `PANEL_TILT`, `ENC_Z0`, `US_ARM_Z`, `MAST_OD`), then run the macro again with that document active. Every part is rebuilt at the new values.
4. Board positions on the plate are in the `LAYOUT` dictionary at the top of the macro (plate coordinates in mm).
5. Each part has an `AGRI_GRID` property group: Manufacturer, PartNumber, **Status**, Source, Notes.

Alternatively, File → Import the STEP. That gives fixed solids only; the macro version is the editable one.

## How exact is it?
| Status | Meaning | Parts |
|---|---|---|
| **DATASHEET** | Outline taken from manufacturer data | Fibox PC 200/150 HG (255 H × 180 W × 150 D), MIV 200 plate (223 × 148 × 1.5), Genasun GV-5 (110 × 56 × 29), Pololu D24V50F5 (17.8 × 20.3 × 8.8, M2 holes 13.46 × 16.0), D24V22F3 (17.8 × 17.8), ESP32-DevKitC V4 (54.4 × 27.9), E22-900M22S (20 × 14 × 2.8), DFR0845 (47 × 37), ANT-868-CW-HW-SMA (135.5 long, Ø10.7 max), LAPP SKINTOP ST-M M20 (53111220, 6–13 mm), Fibox FP 22046 lugs |
| **PROXY** | Size is reasonable, but it is not manufacturer CAD | Battery (Himax-class 151 × 65 × 94, SKU not verified), solar panel, SEN0311 sensor body, SEN0602 body/needle split, radiation shield, M16 glands, PCE 12 vent, fuse holder, terminals, U-bolts |
| **CUSTOM** | You make these parts, so the model's dimensions are the design | Mast, footing, brackets, arms, clamps, rails, carriers, battery cradle |
| **REFERENCE** | Not a part: an aid for checking | Ultrasonic 60° field-of-view cone, cover clearance slab, service clearance zone, cable routes |

**Swap-in vendor CAD.** These files exist but need a login or a download that I could not make here:
- Fibox `6011329_FIBOX_MNX_PC_200_150_HG.step` (fibox.com, login required)
- Pololu STEP and drill DXF (product pages #2851 and #2857)
- Genasun enclosure `.stp` (sunforgellc.com/product/gv-5)

To swap one in: import the file, align it to the proxy, then hide the proxy.

## Verification results
- **Collision check: 0 clashes** across all 184 solids (convex separating-axis test, 0.05 mm tolerance). The test runs on the STEP geometry. Through-holes and mounts that touch by design are whitelisted in the script.
- **Cover clearance:** the tallest internal item is the battery terminals, 114 mm from the floor. The cover's inner face is at 146.5 mm, so the gap is about 32 mm.
- **Ultrasonic field-of-view cone** (60°, from about 450 mm down to the ground): clear of the mast, footing, soil probe and every cable.
- **STEP file integrity:** every face loop is closed and manifold, and there are no dangling entity references.

## Corrections relative to the reference images
1. The **Fibox MNX PC has a screw-on cover (4 polyamide screws) and no hinges.** The box is portrait: 180 wide and 255 tall.
2. **Genasun GV-5 is 110 × 56 × 29 mm** (Genasun/Sunforge, all GV-5 models), not 74 × 46 mm.
3. **DFRobot SEN0602 measures soil moisture, temperature and pH. It does not measure EC.** If EC is required, choose a different RS485 probe.
4. The **battery (151 mm) is wider than the plate (148 mm)**. It is mounted on its long side with its terminals facing the cover.
5. The **SEN0311 lead is only about 30 cm**, so it needs a sealed 4-core extension to reach the gland.

## Design holds — verify before ordering or drilling
- **Fibox base/cover split** (`ENC_BASE_D` = 120), wall thickness, and the positions of the plate bosses and plate holes. Check all of these against the Fibox STEP or the MNX200H drawing *before drilling glands*.
- **Solar panel size conflict for WAAREE WS-20-12V:** 516 × 460 × 40 (WAAREE shop) versus 485 × 350 × 22 (L&T-SuFin). The model uses the larger, worst case.
- **Battery:** exact SKU, terminal type and terminal positions.
- **ESP32-DevKitC header row spacing** is assumed to be 25.4 mm. Measure your board before soldering the carrier.
- **Mounting holes still marked PROXY:** GV-5, DFR0845 (40 × 30 assumed) and D24V22F3.
- **M16 gland part number** `53111210` is the expected LAPP number but has not been verified.
- **USB access:** the gap between the micro-USB connector and the side wall is about 21 mm. Use a right-angle cable, or program the board before mounting it.

## Engineering notes (first pass — not a structural sign-off)
**Mast.** The mast is 60.3 × 3.65 GI pipe (IS 1239 50NB medium) instead of 48.3 mm. The bending stress at the footing, with Cf = 1.3, panel centre at 2.13 m and V = basic wind speed:

| V (m/s) | Panel 516×460, Ø60.3×3.65 | Panel 516×460, Ø48.3×3.2 |
|---|---|---|
| 39 | 76 MPa | 138 MPa |
| 44 | 97 MPa | 176 MPa |
| 50 | 125 MPa | **227 MPa — exceeds yield (~195 MPa)** |

For sites in a 47–50 m/s zone, use a 400 × 400 × 700 footing, and fit the 12 mm anti-rotation bar.

**Electrical.**
- The panel's Voc of 21.17 V rises to about 22.2 V on a cold morning. That is slightly above Genasun's *recommended* 22 V at STC, but well under its 27 V absolute maximum. Confirm with the panel datasheet.
- Use **GV-5-Li-14.2V**: it charges at 14.2 V, which is below the battery's 14.6 V maximum.
- Feed the 12 V bus from the GV-5 **LOAD** terminals, so the low-voltage disconnect (LVD) protects the battery.
- The DFR0845 can pass 12 V through to the SEN0602 (5–30 V).

**Radio.** Configure the E22 for **865–867 MHz (IN865)**. The ANT-868 antenna covers 855–880 MHz.

**Sealing.** The individual IP ratings do not transfer to the drilled, assembled box. Spray- or immersion-test the finished enclosure.

## Sources
- [Fibox PC 200/150 HG 6011329](https://www.fibox.com/products/MNX/PC-ABS-200H/6011329) · [Onninen listing](https://onninen.fi/en/fibox-mounting-enclosure-pc-pc-200-150-hg/p/ANJ267) · [MIV 200 plate](https://www.distrelec.ch/en/mounting-plate-galvanized-steel-148-223mm-fibox-miv-200-mounting-plate/p/15058581)
- [Genasun GV-5 (Sunforge)](https://sunforgellc.com/product/gv-5/) · [GV-5 manual 2012](https://power.sil.org/wp-content/uploads/2015/11/genasun-gv-5-charge-controller-manual-2012-02.pdf)
- [Pololu D24V50F5 #2851](https://www.pololu.com/product-info-merged/2851)
- [ESP32-DevKitC V4 (done.land)](https://done.land/components/microcontroller/families/esp/esp32/developmentboards/esp32s/esp32devkitcv4/) · [Espressif guide](https://docs.espressif.com/projects/esp-idf/en/v5.2.2/esp32/hw-reference/esp32/get-started-devkitc.html)
- [E22-900M22S (LCSC/Flux)](https://www.flux.ai/lcsc/e22-900m22s.md)
- [DFR0845 wiki](https://wiki.dfrobot.com/DFR0845) · [DFR0845 size (Gotronic)](https://www.gotronic.fr/art-module-rs485-gravity-dfr0845-34171.htm)
- [SEN0311 wiki](https://wiki.dfrobot.com/_A02YYUW_Waterproof_Ultrasonic_Sensor_SKU_SEN0311) · [SEN0311 size (Bastelgarage)](https://www.bastelgarage.ch/a02yyuw-waterproof-ultrasonic-distance-sensor)
- [SEN0602 wiki](https://wiki.dfrobot.com/RS485_Soil_Sensor_Temperature_Humidity_PH_SKU_SEN0602)
- [ANT-868-CW-HW datasheet](https://mikrocontroller.net/attachment/176818/ANT-868-CW-HW_Data_Sheet-9806.pdf)
- [LAPP 53111220](https://automa.net/lapp/53111220/) · [icotek PCE](https://www.icotek.com/Produkte/PDFs/en/PCE.pdf)
- [WAAREE WS-20 (L&T-SuFin)](https://lntsufin.com/product/waaree-ws-20-20-w-polycrystalline-solar-panel/17085-4605) · [WAAREE WS-20-12V (Moglix)](https://www.moglix.com/waaree-20w-polycrystalline-solar-panel-ws-20-12v/mp/msne5nlel2my9l)
