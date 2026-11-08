# AGRI-GRID dielectric profile probe

Design of record for the probe shown in the Probe Explorer (`/probe`). Every dimension here is also in
`spec/probe-spec.json`, which drives the 3D model, the layout functions and the automated tests
(`npm run test:probe`). The build sheet and its source scripts are in `documentation/probe-sources/`.

**Status line:** the probe is in build. Nothing on this page is a measurement. Thresholds, drying rates,
touch counts and calibration numbers are illustrative until the pilot logs real data.

---

## 1. Problem: why depth matters

- Continuously flooded rice paddies emit methane: soil microbes produce it when standing water cuts off oxygen.
- Alternate wetting and drying (AWD) lets the water drop below the surface, then re-floods. IRRI's rule:
  **re-irrigate when the water is 15 cm below the soil surface**. IRRI reports up to 30 % less irrigation water and
  a 48 % cut in methane from AWD in India ([IRRI India](https://www.irri.org/where-we-work/india)).
- Farmers check the water level today with a perforated field-water tube ("pani pipe"). It needs a daily visit and
  says nothing about moisture once the water table drops into the soil.
- C-band radar (Sentinel-1) sees the top few centimetres of soil every 6–12 days. The AWD decision sits at
  −15 cm, below what radar sees. A ground probe that reads moisture at four depths fills that gap.

## 2. Principle

- **Capacitance (dielectric) sensing.** Each copper band inside the tube and its neighbouring guard/ground electrodes
  form a capacitor. The electric field fringes out through the PETG wall into a few millimetres of soil.
- **Permittivity.** Water ε ≈ 80; air ≈ 1; soil minerals and dry soil ε ≈ 3–5; PETG ε ≈ 2.4–3. Wetter soil →
  higher apparent permittivity → higher capacitance.
- **Measurement.** The ESP32 touch peripheral counts charge/discharge cycles on each band; the count falls as
  capacitance rises. The band is excited at roughly 1 MHz.
- **Conversion.** Topp et al. (1980): θ = −0.053 + 0.0292ε − 5.5×10⁻⁴ε² + 4.3×10⁻⁶ε³ (θ in m³/m³). This is a
  literature curve; it is replaced by a soil-specific calibration (section 6).
- **Not fringe.** Commercial capacitance profile probes (for example Sentek EnviroSCAN) put rings inside a plastic
  access tube at several depths. The AGRI-GRID probe uses the same principle with printed parts and copper tape.
- **Depth match with radar.** E1 (0–5 cm) matches C-band SAR penetration; E3/E4 (10–20 cm) hold the −15 cm AWD
  decision that SAR cannot see.

## 3. Mechanical design

### P1 · hero probe (node A1)
| Item | Value |
|---|---|
| Tube | OD 25.0 mm, wall 1.6 ± 0.1 mm, ID 21.8 mm, Z +140 … −210 mm (Z 0 = soil surface) |
| Tip | cone Z −210 … −230, point radius 1.5 mm, plug OD 21.4 × 10 mm |
| Seam | tongue 1.0 × 1.0 mm into groove 1.2 × 1.2 mm, epoxy |
| Sections | lower Z −210 … +10, upper +10 … +140 (split for a 235 mm bed) |
| Coupler | OD 21.4, wall 2.0, length 30, 6 mm wire slot, centred at Z +10 (15 mm into each section) |
| Copper pockets | 0.15 mm deep, tape flush with the inner wall |
| Sense bands | E1–E4 centred at −25 / −75 / −125 / −175 mm, 10 mm high, 120° arc on half A |
| Guards | 4 mm high, 9–13 mm from each band centre, grounded |
| Water strip EW | 6 mm wide, Z −5 … +100; EW-GND 3 mm wide, 4 mm gap |
| Ribs (half B) | 1.0 mm high, 1.0 mm wide, 4 mm apart: the wire channel |
| DS18B20 | Ø 6 × 50 mm at Z −100 in a printed clip, against the wall |
| Outside | soil-line groove 0.5 × 0.4 mm at Z 0; raised ticks 0–10 cm (0.4 mm); white above Z 0 |
| Cap | OD 32, height 30, socket 15 deep (ID 25.4), wire chamber ID 18 × 10, gland hole 12.5 |
| EREF | 10 × 10 mm copper pad on the chamber wall, sealed with epoxy (sees no soil) |
| Gland | PG7 (thread 12.5, hex 15 AF), cable OD 5 mm |
| Conductors | E1, E2, E3, E4, EW, GND, DS-VDD, DS-DQ, EREF (9); 11-pin cable, lead ≤ 400 mm |

### P2 · mini probe (field nodes B2, C3, D4)
Tube Z +100 … −110 (one piece), tip to −130; EW strip −5 … +80; one sense band ES at −75 mm (5–10 cm). Conductors EW, ES, GND.

### P3 · cutaway display probe
A P1 with the front half removed, on a stand: base 220 × 60 × 5 mm, saddles Ø 25.4 at 40 and 180 mm, 15° tilt; engraved labels 0.6 mm deep, 5 mm high.

### P4 · test stub
60 mm piece with one band (S1) and guards, closed end disc, for calibration cups.

### N1 · node box (×4, identical)
Inner 110 × 130 × 55 mm, wall 2.4, floor 3.0, lid 3.0, corner radius 4; four Ø 9 bosses with M4 heat-set inserts;
gasket 2.2 × 1.5 mm in a rim groove; perfboard on four Ø 6 × 25 standoffs (65 × 85 pattern); 18650 holder 80 × 25;
glands PG7 (probe) + 8 mm spare (printed plug); two C-clips for a 20 mm stake (ID 20.5, wall 4, opening 14, 15 high, at 30 and 100 mm);
raised ID 18 mm and brand 6 mm on the lid (0.8 mm); A1 solar bracket at 20° for a 110 × 70 mm 1 W panel.

### G1 · staff gauge
Bar 280 × 30 × 4 mm, scale −150 … +100 mm, long ticks 12 × 1.2, short 8 × 0.8, numbers every 20 mm (6 mm high), engraved 0.6 mm.
Driven into the soil with zero at the surface, or held in the C1 clamp.

### C1 · tub clamp, C2 · pump outlet clip
C1 grips a tub wall (25 deep, 30 wide, 30 arm) with a probe ring Ø 25.4 × 15 and a gauge slot 30.4 × 4.4. C2 hooks the pump outlet over the rim (bore +0.3 mm, outlet at 30°).

### Print settings, sealing, tolerances, leak test
- 0.4 mm nozzle, 0.2 mm layers, 4 perimeters, matte PETG, no supports. Halves print arch-up with the cut faces on the bed.
- Check the wall with calipers: sensitivity depends on 1.6 ± 0.1 mm.
- Seal the seam and the EREF pad with epoxy; the PG7 gland seals the cable.
- Leak test every probe: stand it in a bucket to the soil-line groove for 24 h, then read all bands dry in air.
  A band that stays "wet" means a leak.

## 4. Electronics

### Hero node A1 (ESP32)
| Signal | GPIO | Note |
|---|---|---|
| E1 soil 0–5 cm | GPIO32 | T9 |
| E2 soil 5–10 cm | GPIO33 | T8 |
| E3 soil 10–15 cm | GPIO27 | T7 |
| E4 soil 15–20 cm | GPIO14 | T6 |
| EW water strip | GPIO13 | T4 |
| EREF sealed reference | GPIO4 | T0 |
| DS18B20 data | GPIO25 | 4.7 kΩ pull-up |
| I²C SDA (SHT31, INA219) | GPIO21 | |
| I²C SCL | GPIO22 | |
| Battery sense 220k/220k | GPIO34 | ADC1 |

### Field nodes B2, C3, D4 (NodeMCU / ESP8266, RC timing)
| Signal | GPIO | Pin |
|---|---|---|
| EW receive | GPIO12 | D6 |
| ES receive | GPIO13 | D7 |
| RC send, water | GPIO14 | D5 |
| RC send, soil | GPIO15 | D8 |
| Sensor power | GPIO5 | D1 |
| Deep-sleep wake | GPIO16 | D0 → RST |

### Gateway (Prototype: mains, at the farmhouse)
| Signal | GPIO | Note |
|---|---|---|
| SIM800L TXD → ESP RX | GPIO14 | |
| ESP TX → divider → SIM800L RXD | GPIO15 | 1 kΩ / 2 kΩ |
| Pump relay / MOSFET | GPIO13 | HIGH = pump on |

Clear-lid IP junction box, isolated 230 V AC → 5 V module, ESP32 + SIM800L (2G SMS), relay for a 12 V pump, cable gland, 2-pin plug. Modelled generic and unbranded.

### Power path
1 W panel → TP4056 (with DW01 protection) → 18650 → HT7833 or AP2112K-3.3 → ESP32. Deep sleep between readings.
- **Why not MCP1700 or HT7333:** too little output current for the ESP32's radio bursts.
- **Why not ESP32-C3 for the hero node:** it has no capacitive touch peripheral, which the bands rely on.

## 5. Firmware outline

1. Wake from deep sleep; power the sensor rail.
2. Read each band N times (for example 16) and take the median; read EREF and the DS18B20.
3. Drift correction: subtract EREF's change from its baseline, then a temperature term from the DS18B20 (coefficient from calibration).
4. Convert to θ with the active curve (Topp until a soil calibration is loaded).
5. Plausibility: a single jump larger than a set step is flagged; take three more samples; keep the median.
6. Send one ESP-NOW packet to the gateway; go back to sleep.

**Packet (little-endian, 32 bytes):** `node_id u8 · seq u16 · flags u8 · batt_mV u16 · temp_c×100 i16 · eref u16 · ew u16 · band[4] u16 · theta[4] u16 (×1000) · crc u16 · reserved`.

**Alert rules (gateway):** irrigate when the E3/E4 θ crosses the calibrated threshold, or EW shows the water table below −150 mm;
anomaly when one node dries far faster than its neighbours (drying-rate comparison + IsolationForest on the server).
**Rate limits:** at most one SMS per field per alert type per 12 h; repeat only on a state change.
**SMS rules:** one plain sentence in the farmer's language (`lib/advice.js`), the field and node ID, and one action.

## 6. Calibration procedure

1. Prepare 5–6 cups of the same soil from air-dry to saturated; pack to field density.
2. Insert the P4 stub (or a P1) to the same depth in each cup; record 30 counts and take the median.
3. Weigh each cup (m_wet), oven-dry at 105 °C for 24 h, weigh again (m_dry).
4. θ = (m_wet − m_dry) / (ρ_w · V).
5. Fit count → θ (linear or quadratic); store per probe and per soil; replace the Topp curve.

**Data template (CSV):** `probe_id,soil_id,cup,depth_mm,count_median,count_sd,temp_c,m_wet_g,m_dry_g,volume_cm3,theta`

## 7. SAR cross-check: method and limits

- Compare **calibrated θ trends** at E1 with Sentinel-1 VV/VH backscatter over the same field and dates, not raw counts.
- The probe runs near 1 MHz and SAR at 5.4 GHz: salinity and clay affect the probe much more. Expect per-field fits.
- When ground and space disagree, the backend does not average them: the disagreement engine flags the field for a person.

## 8. Failure modes and diagnostics

| Failure | Symptom in the data | Fix |
|---|---|---|
| Air gap beside the tube | one band reads low | firm the soil; re-install in a fresh auger hole |
| Dry clay shrinks from the tube | all bands fall together | re-wet and re-firm; read trends, not absolutes |
| Saline soil | reads too wet | calibrate in your own soil; FDC1004 upgrade |
| Temperature drift | daily wave in counts | EREF + DS18B20 correction |
| Seam leak | a band stuck at "wet" | epoxy seam; bucket leak test |
| Cable moved | single spike | flag, resample 3×, recover |

## 9. Measured vs illustrative, and what the pilot must prove

Measured today: nothing on the probe. Illustrative: every count, θ, threshold and drying rate in the Explorer.
The pilot must prove: (1) a seven-day field run with all nodes logging; (2) ESP-NOW range across the plots;
(3) deep-sleep current and battery autonomy; (4) probe accuracy against gravimetric samples in local soil.

The honest claim: "It reliably shows wet-vs-dry trends and the threshold crossing at each depth. After calibration in your own soil
it gives approximate water content. Absolute accuracy is not measured yet."

<!-- costs:start -->
## 10. Costs

The full probe-node BOM is being priced. Network-side reference prices from the team's sourcing BOM
(`CONTEXT-PACK/08-sourcing-budget`, T2 verified listings):
- ESP-NOW uses the ESP32's own radio: ₹0 extra per node.
- LoRa radio module (RFM95W 868 MHz): ₹676 per node.
- LoRaWAN gateway (RAK WisGate Edge Lite 2, IN865): ₹20,789 ex-GST (indoor, IP30).
- Commercial capacitance profile probes: price OPEN (not yet sourced).
<!-- costs:end -->

## 11. Sources

- IRRI, AWD in India: https://www.irri.org/where-we-work/india (water saving up to 30 %, methane −48 %, 15 cm rule).
- Topp, G. C., Davis, J. L., Annan, A. P. (1980). Electromagnetic determination of soil water content. *Water Resources Research* 16(3), 574–582.
- ESA Sentinel-1 mission (C-band SAR, 6–12 day revisit): https://sentinels.copernicus.eu/web/sentinel/missions/sentinel-1
- IPCC 2019 Refinement, Vol. 4, Ch. 5 (Cropland, rice): EF_c and SF_w defaults (confirm 1.19 kg CH₄/ha/day and 0.55 against Tables 5.11/5.12).
- Chen et al. (2025), *Earth's Future*, India rice CH₄ 6.5 ± 1.0 Tg/yr: https://doi.org/10.1029/2024EF005479
- India rice area 2024–25: DA&FW estimates (51.27 Mha); USDA FAS (51.3 Mha). Production 150.18 MMT (PIB).
- CONTEXT-PACK `04-research-library` (AWD papers, methane papers, agriculture stats) and `08-sourcing-budget`.
- CGIAR/CCAFS AWD case material: add the link from the research library when confirmed.

## 12. Research prompt

> **Goal:** deepen and verify the AGRI-GRID dielectric profile probe design with primary sources, so the next build round adds accurate detail on electrodes, wiring, electronics, firmware and calibration. Read `PROBE.md`, the build sheet (`docs/probe-sources/`), and `CONTEXT-PACK/04-research-library` and `07-datasheets` first. Search the web for primary sources (peer-reviewed papers, manufacturer application notes, datasheets, standards). Cite every claim with a link, and mark each finding CONFIRMED, CONTRADICTS-OUR-DESIGN or OPEN.
>
> **Questions:**
> 1. **Fringing-field electrodes through a polymer wall:** how sensing depth and sensitivity depend on electrode width, gap, guard geometry and wall thickness and permittivity (PETG ε ≈ 2.4–3). What does the literature say about a 1.6 mm wall, a 10 mm band and 4 mm guards? Is there an optimal band/gap ratio? Find FEM or analytical studies.
> 2. **Commercial capacitance profile probes** (Sentek EnviroSCAN/Drill & Drop, Delta-T PR2, AquaCheck, CS655 for contrast): electrode geometry, excitation frequency, access-tube material, published sensing volume and accuracy, temperature and salinity correction. What can we copy legally as principles?
> 3. **ESP32 touch peripheral as a capacitance sensor:** excitation frequency and waveform, resolution, noise, temperature drift, settings (`touch_pad_set_meas_time`, charge/discharge voltages), known pitfalls with long leads. Can it read 9 conductors over 40 cm reliably? Shielded vs unshielded cable, guard driving.
> 4. **Salinity and frequency:** at ~1 MHz how much do EC and soil type bias the reading? Published correction methods. Compare with an FDC1004 (shield drive, CAPDAC) or a 50–150 MHz oscillator front end. A concrete upgrade circuit with part numbers.
> 5. **Paddy soils specifically:** puddled clay, saturation behaviour, cracking on drying, the air-gap effect. Studies of capacitance sensors in rice fields and AWD monitoring (perforated pipe vs sensors).
> 6. **Calibration:** best practice for soil-specific calibration (gravimetric, number of points, temperature correction, model form), and Topp validity limits for clay and organic soils.
> 7. **Water-level strip:** capacitive level sensing linearity, temperature effects, biofilm and algae fouling on the outside of the tube; mitigation.
> 8. **Sealing and materials:** PETG water absorption and long-term permittivity change underground; FDM wall porosity; epoxy choice; UV on the above-ground part; white paint vs UV-stable PETG.
> 9. **SAR link:** C-band penetration depth vs moisture and texture; how σ⁰ (VV/VH) relates to the top 5 cm θ in paddy; published per-field fits; revisit and timing for Sentinel-1 over Maharashtra and Gujarat.
> 10. **Power and radio:** ESP-NOW range in open paddy with node heights 1.2–1.8 m; current budget per reading cycle with deep sleep; 18650 + 1 W panel autonomy through monsoon cloud.
>
> **Deliverables:**
> - A sourced findings table.
> - A list of concrete design changes with reasons (dimensions, materials, circuit, firmware), each tagged with confidence.
> - Updated wiring and schematic notes.
> - Three new chapters or spec cards worth adding to the Probe Explorer.
>
> Never invent numbers: if a value is not found, write OPEN.
