# LoRa Technical Documentation Index

## Documents

| # | File | Title | Source | Type |
|---|------|-------|--------|------|
| 01 | [01-heltec-wifi-lora-32-v3-specs.md](01-heltec-wifi-lora-32-v3-specs.md) | Heltec WiFi LoRa 32 V3 Hardware Specs | Heltec Automation | Datasheet |
| 02 | [02-sx1262-lora-chip-specifications.md](02-sx1262-lora-chip-specifications.md) | SX1262 LoRa Transceiver Specs | Semtech/HopeRF | Datasheet |
| 03 | [03-lorawan-india-frequency-plan.md](03-lorawan-india-frequency-plan.md) | LoRaWAN India Frequency Plan IN865 | LoRa Alliance | Specification |
| 04 | [04-esp32-deep-sleep-power.md](04-esp32-deep-sleep-power.md) | ESP32 Deep Sleep Power Consumption | Espressif | API Reference |
| 05 | [05-esp32-soc-overview.md](05-esp32-soc-overview.md) | ESP32 SoC Technical Overview | Espressif | Product Spec |
| 06 | [06-lora-range-calculation.md](06-lora-range-calculation.md) | LoRa Range & Path Loss Calculation | Semtech/LoRa Alliance | Application Note |
| 07 | [07-thingsboard-integration.md](07-thingsboard-integration.md) | ThingsBoard IoT Platform Guide | ThingsBoard.io | Documentation |

## Summary
- **LoRa Hardware:** Heltec WiFi LoRa 32 V3 (ESP32-S3 + SX1262)
- **LoRa Specs:** SX1262 with 170 dB link budget, -134 dBm sensitivity
- **Frequency:** IN865-867 MHz band for India deployment
- **Power:** ESP32 Deep-sleep ~10 µA, 3+ year battery life
- **Range:** 10-15 km in open agricultural terrain
- **Cloud:** ThingsBoard integration for data visualization and control

## AGRI-GRID Technical Stack
```
Sensor Node: ESP32-S3 + SX1262 + Sensors (Soil pH, Moisture, Temp)
Gateway: ESP32-S3 + SX1262 + Wi-Fi (4G backhaul optional)
Cloud: ThingsBoard (Docker on Raspberry Pi or cloud)
AI: IsolationForest (edge) + ThingsBoard Rule Engine (cloud)
```
