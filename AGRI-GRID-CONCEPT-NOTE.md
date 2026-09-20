# AGRI-GRID: LoRa Sensor Grid for Paddy Water & Methane Intelligence

**IIT Bombay–Honeywell UTKARSH 1.0 · Concept Note**

---

## PAGE 1 — THE IDEA

### Title

**AGRI-GRID** — A LoRa 865MHz star-grid of ESP32 sensors across paddy zones that measures Alternate Wetting & Drying (AWD) water-depth, runs edge-AI anomaly detection, and quantifies methane + water-credit eligibility with an Agri-Stack-ready (sandbox/mock) farmer-identity link.

### Problem

- Paddy farming wastes **30–50% of irrigation water** through continuous flooding.
- Flooded rice is responsible for **~10–12% of India's total methane emissions** — a potent greenhouse gas (28–34× CO₂ over 100 years).
- Farmers have no **measurable proof** of water-saving or methane reduction to access carbon/water-credit schemes.
- Existing IoT tools are single-node, point-solutions with no spatial view, no AWD protocol, and no linkage to government identity or credit systems.

### Solution

A **coordinated LoRa star-grid** (nodes → 1 gateway) across paddy zones that:

1. **Senses** water-depth (JSN-SR04T), temperature (DS18B20), soil moisture (capacitive) per zone.
2. **Infers** AWD compliance, anomalies, and estimated methane reduction on-device (IsolationForest).
3. **Links** each sensor zone to a farmer identity via Agri Stack sandbox schema (UFSI).
4. **Quantifies** water-credit and methane-reduction eligibility in real time.

### Hero Architecture

```
┌──────────────────────────────────────────────────────┐
│                  CLOUD LAYER                         │
│         FastAPI · ThingsBoard · Agri Stack           │
│         ┌──────────┬──────────┬──────────┐           │
│         │ Heatmap  │ Alerts   │ Credit   │           │
│         │Dashboard │ Dashboard│ Engine   │           │
│         └─────▲────┴─────▲────┴─────▲────┘           │
│               │          │          │                  │
│         ┌─────┴──────────┴──────────┴─────┐           │
│         │    LoRa Gateway (ESP32+Ra-02)   │           │
│         │    IN865 · 865–867 MHz          │           │
│         └──▲──────────▲──────────▲────────┘           │
│            │          │          │                    │
│ ┌──────┐┌──────┐┌──────┐                            │
│ │Node 1││Node 2││Node 3│  ← ESP32 + LoRa + Sensors  │
│ └──┬───┘└──┬───┘└──┬───┘                             │
│    │       │       │                                 │
│ ┌──┴──┐ ┌──┴──┐ ┌──┴──┐                             │
│ │Field│ │Field│ │Field│  Paddy zones (1–5 km radius) │
│ └─────┘ └─────┘ └─────┘                             │
└──────────────────────────────────────────────────────┘
```

---

## PAGE 2 — HOW IT WORKS

### Hardware (per node, ₹~2,200)

| Component | Role | Why |
|---|---|---|
| **Heltec WiFi LoRa 32 V3** | MCU + LoRa 865MHz + OLED | IN865 legal in India; 1–5 km range; OLED for local debug |
| **JSN-SR04T** | Water-level depth | IP67 waterproof (bare HC-SR04 rots in paddy) |
| **DS18B20** | Water/soil temperature | Waterproof, ±0.5°C, low cost |
| **Capacitive soil sensor v1.2** | Soil moisture | Non-corrosive, no exposed probes |
| **3.7V 18650 (3400mAh) + 1W solar** | Power | 6–10 months battery; indefinite with solar |
| **IP65 junction box** | Enclosure | Dust/splash-proof for field |

### Workflow

```
SENSE → INFER → LINK → CREDIT
  │        │       │       │
  │        │       │       └─ Estimate methane/water-credit eligibility
  │        │       └───────── Map zone → Agri Stack farmer ID (mock UFSI)
  │        └───────────────── Edge-AI: IsolationForest anomaly + AWD score
  └────────────────────────── Nodes read sensors every 10 min (10-min sleep)
```

### Dashboard

- **Heatmap**: zone-by-zone water stress (red/amber/green)
- **AWD timeline**: water-level line chart per zone, flooded vs AWD cycle
- **Credit gauge**: estimated methane reduction % and water-credit eligibility
- **Alerts**: push when zone is dry/wet outside AWD bounds
- Built on **ThingsBoard** (free tier) or custom **React + Leaflet** frontend

### Edge AI

- **IsolationForest** on-device (sklearn, runs on ESP32-S3 via MicroPython or edge inference on gateway).
- Detects anomalies: sudden water-level drop (leak/drain), temperature spike, dry-soil event.
- Explains via feature importance: which sensor triggered the flag.
- Lightweight: inference < 100ms per reading. No cloud dependency.

---

## PAGE 3 — IMPACT & FEASIBILITY

### Impact

| Metric | Value | SDG |
|---|---|---|
| Water saved | 30–50% vs continuous flooding | **SDG 6** (Clean Water) |
| Methane reduced | 30–50% (AWD protocol) | **SDG 13** (Climate Action) |
| Farmers reached | Scalable via FPO clusters | **SDG 2** (Zero Hunger) |
| Tech affordability | ₹14,995 for 3 nodes + 1 gateway | **SDG 9** (Industry/Innovation) |
| Credit eligibility | Measurable, verifiable | **SDG 12** (Responsible Consumption) |
| Honeywell ESG link | Water conservation + sustainability | **Honeywell CSR pillars** |

### Competition Differentiation

| Feature | AGRI-GRID | paddyAkvo | Generic IoT Kits |
|---|---|---|---|
| Spatial grid (not point) | ✅ star grid | ❌ single node | ❌ single node |
| Edge AI on-device | ✅ IsolationForest | ❌ | ❌ |
| Agri Stack farmer ID | ✅ sandbox/mock | ❌ | ❌ |
| AWD → methane credit | ✅ | ✅ | ❌ |
| IN865 legal (India) | ✅ 865 MHz | ? | often EU868 |
| IP67 water sensor | ✅ JSN-SR04T | ? | bare HC-SR04 |
| Cost per 3-zone build | ₹14,995 | unknown | ₹500–2,000 |

### Cost (Option A — full Heltec build)

| Item | Qty | ₹ |
|---|---|---|
| Heltec WiFi LoRa 32 V3 | 4 | 8,800 |
| JSN-SR04T waterproof ultrasonic | 3 | 945 |
| DS18B20 waterproof temp probe | 3 | 360 |
| Capacitive soil moisture sensor | 3 | 240 |
| 18650 battery + shield | 4 sets | 2,200 |
| 1W solar panel | 3 | 750 |
| IP65 junction box | 4 | 800 |
| Cables / connectors / misc | — | 900 |
| **Total** | | **₹14,995** |

**Option B** (budget): ESP32 + Ra-02 LoRa module → **₹6,586** for 3 nodes + 1 gateway.

---

*Document: AGRI-GRID Concept Note · 3-page · UTKARSH 1.0 · July 2026*
