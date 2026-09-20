# AGRI-GRID: IoT Grid-Based Precision Farming Platform
## Complete Build Plan — UTKARSH 1.0 Hackathon

> **TL;DR (post-research hardening, July 12 2026):** AGRI-GRID is a 3-node LoRa **star grid** (865MHz IN865) of ESP32 sensors across paddy zones that measures Alternate Wetting & Drying (AWD) water-depth, runs edge-AI anomaly detection, and quantifies **methane + water-credit eligibility** with an Agri-Stack-ready (sandbox/mock) farmer-identity link. Build cost ~₹15K, 4-day build, offline-first. Differentiator vs the crowded "IoT farming" space: AWD→credit engine + Agri Stack identity + edge AI in one cheap build. Honeywell framing = measurable ESG/water savings.

---

## 1. PROJECT OVERVIEW

**Name:** AGRI-GRID
**Tagline:** "Distributed Intelligence for Indian Agriculture"
**Problem:** Farmers walk fields manually checking water levels across paddy zones — wastes time, misses anomalies, over/under-irrigates
**Solution:** LoRa sensor GRID (star topology: nodes → 1 gateway; multi-hop mesh as stretch goal) of ESP32 nodes + edge-AI spatial analytics dashboard with Agri-Stack-ready farmer identity linkage.

### What Makes This Different
| Feature | Typical Hackathon Project | AGRI-GRID |
|---------|--------------------------|-----------|
| Sensors | 1 node, WiFi | 3+ nodes, LoRa star grid (865MHz IN865) |
| Range | 10-50m (WiFi) | 1-5 km (LoRa, realistic in paddy; 865MHz IN865) |
| Data | Single point | Spatial heatmap |
| Intelligence | Basic threshold alerts | AI anomaly detection across grid |
| Government | None | Agri-Stack-ready (sandbox/mock) + AWD methane/credit edge |
| Power | USB/wall outlet | Solar + battery (months of operation) |
| Network | Centralized | Coordinated star grid (mesh = stretch goal) |

---

## 2. SYSTEM ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────┐
│                    CLOUD LAYER                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  ThingsBoard  │  │  PostgreSQL  │  │  Agri Stack  │      │
│  │  (Dashboard)  │  │  (Database)  │  │  API (UFSI)  │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                 │                  │               │
│         └─────────────────┼──────────────────┘               │
│                           │                                  │
└───────────────────────────┼──────────────────────────────────┘
                            │ MQTT/HTTP
                            │
┌───────────────────────────┼──────────────────────────────────┐
│                    GATEWAY NODE                              │
│                           │                                  │
│              ┌────────────┴────────────┐                     │
│              │   ESP32 + SX1262 LoRa   │                     │
│              │   + WiFi (uplink)       │                     │
│              │   + OLED Display        │                     │
│              └────────────┬────────────┘                     │
│                           │ LoRa 865-867 MHz                 │
│              ┌────────────┼────────────┐                     │
│              │            │            │                     │
└──────────────┼────────────┼────────────┼─────────────────────┘
               │            │            │
    ┌──────────┴──┐  ┌──────┴──────┐  ┌──┴──────────┐
    │  NODE A     │  │  NODE B     │  │  NODE C     │
    │  ESP32+LoRa │  │  ESP32+LoRa │  │  ESP32+LoRa │
    │  + Sensors  │  │  + Sensors  │  │  + Sensors  │
    │  + Solar    │  │  + Solar    │  │  + Solar    │
    │             │  │             │  │             │
    │ Zone: NW    │  │ Zone: NE    │  │ Zone: S     │
    │ Field Edge  │  │ Field Edge  │  │ Field Center│
    └─────────────┘  └─────────────┘  └─────────────┘

    Sensors per node:
    ├── Water Level (JSN-SR04T waterproof ultrasonic, IP67)
    ├── Temperature (DS18B20 waterproof probe)
    ├── Soil Moisture (capacitive v1.2)
    └── Battery Voltage (ADC)
```

---

## 3. COMPONENT LIST & INDIAN PRICING

### Option A: Using Heltec/TTGO LoRa32 Boards (Integrated ESP32+LoRa)

| Component | Qty | Unit Price (₹) | Total (₹) | Source |
|-----------|-----|-----------------|-----------|--------|
| Heltec WiFi LoRa 32 V3 (ESP32+SX1262+OLED) | 4 | ₹2,200 | ₹8,800 | Robocraze |
| Capacitive Soil Moisture Sensor v1.2 | 3 | ₹80 | ₹240 | Robocraze/Amazon |
| DS18B20 Waterproof Temperature Probe | 3 | ₹120 | ₹360 | Robocraze/Amazon |
| JSN-SR04T Waterproof Ultrasonic (water level) | 3 | ₹315 | ₹945 | Robocraze/Amazon |
| 3.7V 18650 Li-ion Battery (3400mAh) | 6 | ₹200 | ₹1,200 | Amazon |
| 18650 Battery Shield (2-cell) | 4 | ₹250 | ₹1,000 | Robocraze |
| 6V/1W Solar Panel (nodes only; gateway on USB) | 3 | ₹250 | ₹750 | Amazon |
| IP65 Waterproof Junction Box | 4 | ₹200 | ₹800 | Amazon |
| 865MHz SMA Antenna (IN865) | 4 | ₹150 | ₹600 | Robocraze |
| Jumper Wires, Connectors, Misc | - | - | ₹300 | - |
| **TOTAL** | | | **₹14,995** | |

### Option B: Budget Build (ESP32 + Separate LoRa Module)

| Component | Qty | Unit Price (₹) | Total (₹) |
|-----------|-----|-----------------|-----------|
| ESP32 Dev Board (38-pin) | 4 | ₹389 | ₹1,556 |
| Ra-02 SX1276 LoRa Module (865MHz IN865) | 4 | ₹400 | ₹1,600 |
| Sensors (same as above) | 3 sets | ₹260 | ₹780 |
| Batteries + Solar (same) | - | - | ₹1,650 |
| Enclosures + Misc | - | - | ₹1,000 |
| **TOTAL** | | | **₹6,586** |

**Recommended:** Option A — Heltec boards are pre-integrated, save wiring time, have OLED for debugging, and include battery management.

---

## 4. SENSOR SPECIFICATIONS

### Water Level Sensor (Paddy Field)
**Method:** JSN-SR04T waterproof ultrasonic in a PVC "stilling tube" mounted above the water surface
- Range: 20cm - 600cm (sensor spec), paddy water depth 2-30cm typical
- Accuracy: ±3mm (sensor), ±1cm usable after stilling-tube damping
- Mounting: PVC tube sunk into bund, sensor faces down at water surface — stilling tube removes wave/ripple noise
- Why this sensor: Bare HC-SR04 is NOT waterproof (rots in ~6 months in humidity); JSN-SR04T is IP67 sealed. Muddy water still reflects ultrasound fine (mud is below the surface).
- Reference: IIJ Japan's MITSUHA LP-01 paddy sensor uses the same sealed-ultrasonic approach (±1.0cm, IP67, 2×AA/season).
- ₹315/node vs IIJ's commercial price — 2-3 weeks battery on 2×AA, or months on 18650+solar.

**Alternative:** Capacitive water level sensor (no moving parts, submersible)
- More reliable but costs ₹500+ per unit
- Better for long-term deployment

### Temperature Sensor
**DS18B20 Waterproof Probe**
- Range: -55°C to +125°C
- Accuracy: ±0.5°C
- Waterproof stainless steel probe
- One-Wire protocol (single GPIO pin)

### Soil Moisture Sensor
**Capacitive v1.2 (NOT resistive)**
- Capacitive = no corrosion, lasts months
- Resistive = corrodes in weeks, unreliable
- Calibration: Air = 0%, Saturated soil = 100%

### Battery Voltage Monitoring
- Voltage divider (2x 100kΩ resistors) to ESP32 ADC
- Monitor battery level for solar-powered nodes
- Alert when battery < 20%

---

## 5. FIRMWARE ARCHITECTURE

### Sensor Node Firmware (ESP32 Arduino IDE)

```cpp
// Pseudocode — Sensor Node
#include <LoRa.h>
#include <DHT.h>
#include <OneWire.h>
#include <DallasTemperature.h>

// Pin definitions
#define LORA_SS 18
#define LORA_RST 14
#define LORA_DIO0 26
#define SOIL_MOISTURE_PIN 34
#define ULTRASONIC_TRIG 12
#define ULTRASONIC_ECHO 13
#define DS18B20_PIN 15
#define BATTERY_ADC 35

// Node configuration
const int NODE_ID = 1;  // 1, 2, 3 for each zone
const int ZONE_LAT = 19;  // Latitude (simplified)
const int ZONE_LON = 73;  // Longitude (simplified)
const long TX_INTERVAL = 300000;  // 5 minutes

struct SensorData {
  int nodeId;
  float waterLevel;    // cm
  float temperature;   // °C
  float soilMoisture;  // %
  float batteryVoltage;// V
  unsigned long timestamp;
};

void setup() {
  Serial.begin(115200);
  LoRa.setPins(LORA_SS, LORA_RST, LORA_DIO0);
  LoRa.begin(865062500);  // India ISM band
  initSensors();
  esp_sleep_enable_timer_wakeup(TX_INTERVAL * 1000);  // microseconds
}

void loop() {
  SensorData data = readSensors();
  sendLoRaPacket(data);
  Serial.println("Data sent, sleeping...");
  esp_light_sleep_start();  // Deep sleep between readings
}

SensorData readSensors() {
  SensorData d;
  d.nodeId = NODE_ID;
  d.waterLevel = readUltrasonic();
  d.temperature = readDS18B20();
  d.soilMoisture = readCapacitiveSoil();
  d.batteryVoltage = readBattery();
  d.timestamp = millis();
  return d;
}

void sendLoRaPacket(SensorData d) {
  LoRa.beginPacket();
  // JSON format for easy parsing
  String packet = "{\"id\":" + String(d.nodeId) +
                  ",\"wl\":" + String(d.waterLevel, 1) +
                  ",\"t\":" + String(d.temperature, 1) +
                  ",\"sm\":" + String(d.soilMoisture, 1) +
                  ",\"bv\":" + String(d.batteryVoltage, 2) +
                  ",\"ts\":" + String(d.timestamp) + "}";
  LoRa.print(packet);
  LoRa.endPacket();
}
```

### Gateway Firmware (ESP32 + LoRa + WiFi)

```cpp
// Pseudocode — Gateway Node
#include <LoRa.h>
#include <WiFi.h>
#include <HTTPClient.h>

const char* ssid = "YOUR_WIFI";
const char* password = "YOUR_PASSWORD";
const char* serverUrl = "http://YOUR_SERVER:8000/api/sensor-data";

void setup() {
  LoRa.begin(865062500);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) delay(500);
}

void loop() {
  int packetSize = LoRa.parsePacket();
  if (packetSize) {
    String packet = "";
    while (LoRa.available()) {
      packet += (char)LoRa.read();
    }
    int rssi = LoRa.packetRssi();

    // Add RSSI and forward to cloud
    // Parse JSON, add gateway metadata
    forwardToCloud(packet, rssi);
  }
}

void forwardToCloud(String packet, int rssi) {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(serverUrl);
    http.addHeader("Content-Type", "application/json");

    // Add gateway metadata
    String payload = packet;
    payload.replace("}", ",\"rssi\":" + String(rssi) + "}");

    int httpResponseCode = http.POST(payload);
    http.end();
  }
}
```

---

## 6. BACKEND STACK

### Option A: FastAPI + PostgreSQL (Recommended)
- FastAPI receives data from gateway via HTTP POST
- Stores in PostgreSQL with PostGIS for spatial queries
- Anomaly detection via sklearn IsolationForest
- REST API for dashboard consumption

### Option B: ThingsBoard (Faster Setup)
- Open-source IoT platform
- Built-in device management, dashboards, rule engine
- MQTT integration with LoRa gateway
- 600+ widgets including heatmaps
- Free community edition

### Option C: Firebase (Simplest)
- Real-time database
- ESP32 sends data via WiFi to Firebase
- Web dashboard reads directly from Firebase
- No server setup needed
- Limitation: No spatial queries, limited analytics

**Recommendation:** ThingsBoard for hackathon (fastest to demo), FastAPI for production.

---

## 7. DASHBOARD FEATURES

### Main Dashboard (ThingsBoard/React)
1. **Grid Overview Map**
   - 3 nodes plotted on field map
   - Color-coded by status (green/yellow/red)
   - Click node for detail view

2. **Spatial Heatmap**
   - Interpolated water level across field zones
   - Real-time color gradient (blue=wet, red=dry)
   - Updated every 5 minutes

3. **Time Series Charts**
   - Water level trend per zone (last 24h, 7d, 30d)
   - Temperature overlay
   - Soil moisture comparison

4. **Alert Panel**
   - Zone-level anomaly alerts
   - Battery low warnings
   - Node offline detection
   - Configurable thresholds

 5. **Agri-Stack-Ready Identity Link** (sandbox/mock, per Section 9)
    - Farmer ID lookup via UFSI schema (simulated payloads)
    - Crop type from Crop Sown Registry → AWD threshold rules
    - Scheme eligibility flag (PM-KUSUM, PMFBY) displayed on dashboard
    - Geo-referenced village map overlay on the heatmap

---

## 8. AI/ML COMPONENT

### Anomaly Detection (Your Team's Strength)
- **Input:** Time series from all grid nodes
- **Model:** IsolationForest (sklearn) or LSTM autoencoder
- **Detection:**
  - Sudden water level drop (leak/breach)
  - Unusual temperature spike (equipment failure)
  - Moisture pattern anomaly (pest/disease indicator)
  - Battery drain pattern (hardware issue)

### Spatial Analysis
- **Interpolation:** Kriging or IDW (Inverse Distance Weighting)
- **Goal:** Estimate water level at unmeasured points between nodes
- **Output:** Continuous heatmap, not just 3 point measurements

### Crop Advisory (Stretch Goal)
- Based on water level + temperature + crop type
- Simple rule-based or decision tree
- "Zone 2 has been over-irrigated for 3 days — risk of root rot"

---

## 9. AGRI STACK INTEGRATION (Unique Angle — HONEST SCOPE)

### Reality Check (verified July 2026)
The UFSI / Agri Stack API is **NOT openly callable by students**. Access requires:
developer-portal registration → MoAFW use-case review → sandbox credentials (Consent
Simulator, simulated data) → CERT-In empaneled security audit + UFSI Compliance Badge
for *production* access. A team cannot make live production calls by Dec 2026.

**Our honest approach:** Build against the published OpenAPI 3.0 UFSI schema with
**simulated/sandbox payloads** (Farmer Registry, Crop Sown). Ship a clean integration
seam (adapter module) so that when sandbox credentials arrive, live calls drop in with
zero code change. Claim **"Agri-Stack-ready (sandbox-integrated)"**, not "live in prod".

### What We Use From Agri Stack (schema-driven)
1. **Farmer Registry** — FPO-scale farmer identity linkage (simulated)
2. **Crop Sown Registry** — crop type per plot → AWD threshold rules
3. **Scheme Eligibility** — PM-KUSUM / PMFBY eligibility flag (simulated)
4. **Geo-referenced Village Maps** — plot boundary overlay on the heatmap

### The REAL Differentiator: AWD → Methane → Credit Engine
Alternate Wetting & Drying (AWD) is the internationally recognised practice that cuts
**paddy methane emissions by 30–50%** (methane is ~12% of ag GHG; flooded paddy is a
top global source). Our grid measures **AWD water-depth** per zone and computes:
- Days-in-AWD compliance → methane-reduction estimate (kg CO₂e/ha/season)
- Water saved (m³) vs continuous flooding
- **Carbon-/water-credit ELIGIBILITY** flag a farmer can take to an MRV/buyer

This is the monetizable, ESG-aligned layer that pure monitoring products miss.

### Competitor Map (verified — this space is CROWDED, narrow or lose)
| Player | What they do | Our edge |
|--------|--------------|----------|
| **paddyAkvo (Enthu Tech)** | LoRa AWD water monitoring for paddy + methane/credit claims | We add **multi-node grid + edge-AI anomaly detection + Agri Stack FPO identity** in one ₹15K build |
| Fasal / CropIn / AgNext | Horticulture / crop-quality sensing | Different crop (not paddy AWD); we stay narrow |
| Cropengine | LoRaWAN water-level sensors (generic) | We are paddy-AWD-specific with credit engine |
| IIJ Japan | Commercial paddy water mgmt (LoRaWAN) | Japan-only; we target India + Agri Stack |

**Conclusion:** Do NOT re-pitch generic "IoT precision farming". Pitch: *"Low-cost
LoRa grid that makes paddy AWD measurable → methane + water-credit eligible, Agri-Stack
identifiable, edge-AI anomaly-checked."* That combination is not shipped by any rival.

---

## 10. JUDGING CRITERIA ALIGNMENT

Based on IIT Bombay hackathon criteria:

| Criterion | Weight | Our Approach |
|-----------|--------|-------------|
| **Innovation** | 25% | LoRa grid + AWD→methane/credit engine + Agri-Stack-ready (unique combo) |
| **Functionality** | 25% | Working demo: live heatmap + alerts + spatial analysis |
| **Technical Execution** | 20% | LoRa star grid (IN865), edge-AI anomaly detection, UFSI schema adapter |
| **Impact/Feasibility** | 20% | Real problem, ₹6K-14K cost, scalable to farms |
| **Presentation** | 10% | Live demo, 3-min pitch, clear architecture diagram |

### SDG Alignment (mandatory for IIT-B / gov panels — state exact numbers)
- **SDG 2 (Zero Hunger):** AWD sustains paddy yield with less water/input.
- **SDG 6 (Clean Water):** Direct water-depth monitoring cuts irrigation water 15–30%.
- **SDG 9 (Industry/Innovation):** LoRa grid = resilient rural IoT infrastructure.
- **SDG 12 (Responsible Consumption):** Water/carbon-credit eligibility drives resource-efficient farming.
- **SDG 13 (Climate Action):** AWD cuts paddy methane 30–50% → measurable ESG.

### Honeywell Framing (judges are Honeywell industry mentors)
Lead with **sustainability / ESG / water conservation / measurable efficiency**, not "an app".
Honeywell's own challenges reward working sensing hardware + AI + ESG outcomes. Pitch line:
*"Real LoRa sensing + edge AI = measurable water savings and methane/ESG reduction,
deployable at village (FPO) scale, SDG-aligned — exactly Honeywell's sustainability thesis."*

### What Wins (from SIH / IIT-B / Honeywell write-ups)
1. **Offline-first prototype** — edge intelligence so the demo survives no-internet.
2. **Narrow problem done perfectly** — ONE thing (paddy AWD) vs 5 half-built features.
3. **Mentor engagement Day 1** — align to real industry need, not feature count.
4. **Deployment realism + cost** — "₹15K for 3 zones, scalable to ₹X/unit" beats slides.
5. **Explicit SDG/ESG + clear team roles** (Embedded / Backend / Demo).

---

## 11. FOUR-DAY BUILD PLAN

### Day 1 (July 12 — TODAY): Hardware + Firmware
**Morning (2 hrs):** Order components (Robocraze same-day shipping)
**Afternoon (4 hrs):**
- Flash Heltec boards with basic LoRa test sketch
- Wire sensors to Node A
- Test LoRa send/receive between 2 boards
- Verify water level sensor readings

**Evening (2 hrs):**
- Build Node B and Node C
- Test all 3 nodes sending to gateway
- Debug any LoRa issues

### Day 2 (July 13): Backend + Integration
**Morning (3 hrs):**
- Set up FastAPI or ThingsBoard
- Create data ingestion endpoint
- Store sensor data in database
- Basic query API

**Afternoon (3 hrs):**
- Connect gateway to backend
- Verify data flow: sensor → LoRa → gateway → backend
- Set up anomaly detection model

**Evening (2 hrs):**
- Begin dashboard layout
- Set up ThingsBoard widgets (if using ThingsBoard)

### Day 3 (July 14): Dashboard + Demo Prep
**Morning (3 hrs):**
- Complete dashboard with heatmap visualization
- Time series charts
- Alert system

**Afternoon (3 hrs):**
- Agri Stack API integration (if time permits)
- End-to-end testing
- Prepare demo data as fallback

**Evening (2 hrs):**
- Practice 3-minute demo presentation
- Prepare slides (5 slides max)
- Test everything one more time

### Day 4 (July 15 — SUBMISSION): Final Polish
**Morning:**
- Final hardware test
- Deploy dashboard to cloud (if needed)
- Submit idea on events-ihcfsi.org

---

## 12. RISK MITIGATION

| Risk | Probability | Mitigation |
|------|------------|------------|
| LoRa boards don't arrive in time | Medium | Order TODAY from Robocraze (same-day shipping in Bangalore) |
| LoRa mesh doesn't work | Medium | Use simple star topology (nodes → gateway) instead of mesh |
| Water level sensor inaccurate | Low | Calibrate with known water levels, use multiple readings |
| Backend crashes during demo | Low | Have Firebase as backup, or local SQLite |
| Dashboard too slow | Low | Use ThingsBoard (proven), or simple HTML+JS |
| Agri Stack API blocked | Medium | Have demo data ready, show API integration in code |
| Battery dies during demo | Low | Keep USB power connected during presentation |

---

## 13. DEMO SCRIPT (3 Minutes)

**0:00-0:30 — Problem Statement**
"Farmers manually walk paddy fields to check water levels across zones. This wastes time, misses anomalies, and leads to over/irrigation."

**0:30-1:00 — Solution Overview**
"AGRI-GRID deploys a grid of ESP32+LoRa sensor nodes across paddy zones (star topology → 1 gateway). Each node measures water level, temperature, and soil moisture. Data flows via LoRa (865MHz IN865) to a gateway, then to our edge-AI dashboard that computes Alternate Wetting & Drying (AWD) water-depth and flags anomalies."

**1:00-2:00 — Live Demo**
- Show dashboard with live heatmap
- Trigger an anomaly (pour water on one sensor)
- Show alert appearing on dashboard
- Show time series chart updating
- Show spatial interpolation between nodes

**2:00-2:30 — Unique Features**
"Unlike single-node projects, our grid gives spatial intelligence. We are Agri-Stack-ready — we build against the UFSI schema with simulated farmer data and link each zone to an FPO farmer identity. Our edge AI computes AWD water-depth, flags anomalies across the field, and quantifies methane/water-credit eligibility."

**2:30-3:00 — Impact & Scalability**
"Cost: ₹6,000-14,000 for 3 zones. Scalable to any farm. Aligns with PM-KUSUM and Digital Agriculture Mission. We're not just monitoring — we're creating a spatial intelligence layer for Indian agriculture."

---

## 14. WHAT TO BUY NOW (July 12)

### From Robocraze (Same-Day Shipping in Bangalore)
1. **Heltec WiFi LoRa 32 V3** × 4 — ₹8,800
   - URL: robocraze.com/collections/lora
   - Search: "ESP32 LoRa"

### From Amazon (1-2 Day Delivery)
2. **Capacitive Soil Moisture Sensor v1.2** × 3 — ₹240
3. **DS18B20 Waterproof Probe** × 3 — ₹360
4. **JSN-SR04T Waterproof Ultrasonic** × 3 — ₹945
5. **18650 Battery + Shield** — ₹1,200
6. **6V Solar Panel** × 3 — ₹450
7. **Waterproof Junction Box** × 4 — ₹800
8. **SMA Antenna 865MHz** × 4 — ₹600

**Total: ~₹12,630 (within ₹15K budget)**

### Order NOW — Every hour counts!

---

## 15. TEAM ASSIGNMENTS

### Member 1 (Neeraj — AI/ML)
- Backend API (FastAPI)
- Anomaly detection model (sklearn)
- Agri Stack API integration
- Database setup

### Member 2 (Amudullah — Hardware)
- Flash firmware to all 4 boards
- Wire sensors to nodes
- Test LoRa communication
- Solar power setup

### Member 3 (Riddhi — Frontend)
- Dashboard (ThingsBoard or React)
- Heatmap visualization
- Alert UI
- Demo slides

### All Together
- Day 1 evening: Integration test
- Day 3 afternoon: End-to-end test
- Day 3 evening: Demo rehearsal

---

## 16. POWER BUDGET (verified July 2026)

- 288 LoRa TX cycles/day, ~2.1s active each. Avg draw ≈0.48 mA → 3400 mAh / 0.48 mA ≈ **295 days battery-only**.
- 1W solar (~160 mA) vastly exceeds ~11.5 mAh/day draw → effectively indefinite.
- **Honest claim:** 6–10 months battery-only with true deep sleep. Heltec V3 board quiescent (~100µA+) can cut this to 1–3 months — so cut board power with a MOSFET between reads to hit the full 6–10 months.

## 17. REFERENCES (verified sources)

- IIJ Japan paddy sensor spec (sealed ultrasonic, LoRaWAN): https://www.iij.ad.jp/biz/iot-agri-paddy/spec.html
- JSN-SR04T waterproof ultrasonic: https://robodo.in/products/waterproof-ultrasonic-module-jsn-sr04t-distance-transducer-sensor-for-arduino
- India license-free bands (865–868 MHz SRD): https://thejeshgn.com/wiki/notebook/license-free-bands-in-india/
- LoRaWAN IN865 frequency plan: https://www.actility.com/lorawan-other-frequency-plans/
- Gateway-Free LoRa Mesh on ESP32 (MDPI Sensors 2025): https://doi.org/10.3390/s25196036
- Agri Stack portal: https://agristack.gov.in/
- Agri Stack builder guide (access gating): https://www.prodcx.com/post/agristack-for-agriculture-a-complete-guide-for-agritech-builders-developers
- IIT-B Honeywell Centre (IHCFSI): https://ihcfsi.iitb.ac.in/
- Honeywell Arena of the Future challenge (ESG/sensors judging): https://www.honeywell.com/us/en/news/featured-stories/2024/04/atlanta-hawks-and-honeywell-announce-winners-of-arena-of-the-future-challenge
- paddyAkvo (direct competitor, LoRa AWD): https://lora-alliance.org/marketplace/enthu-technology-solutions-india-pvt-ltd/paddyakvo-smart-alternate-wet-dry-awd-solution-for-paddy/
- IIT-B OpenHardware hackathon (SDG mandate): https://www.iitb.ac.in/national-level-openhardware-iot-based-geospatial-hackathon
- SIH 2023 winning traits: https://kulkarnishub377.github.io/sk/blog/sih-win-2023.html
- Robocraze LoRa boards (pricing): https://robocraze.com/collections/lora
- Heltec ESP32+LoRa: https://heltec.org/product-category/lora/lrnode/esp32-lora/

---

## 18. EXECUTION LOG (fill in as you go)

> Live tracking of execution-time facts. Plan is frozen at 100/100 — only this section changes.

### Faculty Mentor
- **Name / Dept:** ___________  **Status:** [ ] FOUND  [ ] EMAILED  [ ] CONFIRMED
- Confirmed date: __________

### Hardware Order (Section 14)
- **Order placed:** [ ] YES  [ ] NO — Date: __________
- Vendor: __________  Order ID: __________
- **Shipped:** [ ]  **Delivered:** [ ]
- Lead-time risk: [ ] OK  [ ] AT RISK (note: __________)

### Day-1 Bring-up (July 12) — measured, not claimed
- Node flash OK: [ ]  Gateway flash OK: [ ]
- LoRa link established: [ ]  **Real range measured:** ______ m / km
- Battery draw measured (deep sleep): ______ mA → est. ______ months
- Sensor readings sane (water level / temp / soil): [ ] YES  [ ] NO

### Agri Stack (sandbox/mock)
- Schema mocked: [ ]  Farmer-identity demo data: [ ]

### Submission
- Idea submitted on events-ihcfsi.org: [ ] YES  [ ] NO — Date: __________
- Confirmation / receipt: [ ]

---

*Document created: July 12, 2026*
*Hardened via autoresearch loop: July 12, 2026 (5 research-driven iterations)*
*Deadline: July 15, 2026*
*Status: RESEARCH-HARDENED — READY TO BUILD*
