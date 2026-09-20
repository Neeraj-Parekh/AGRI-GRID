# Heltec WiFi LoRa 32 V3 - Hardware Specifications

- **Source:** Heltec Automation
- **Year:** 2023-2024
- **URL:** https://heltec.org/project/wifi-lora-32/
- **Type:** Datasheet / Product Specification
- **Relevance to AGRI-GRID:** Primary hardware platform for our IoT sensor nodes. Combines ESP32-S3 MCU with SX1262 LoRa transceiver in a single development board.

## Summary
The WiFi LoRa 32 V3 (Heltec V3) is an IoT development board integrating ESP32-S3FN8 MCU with SX1262 LoRa transceiver. It supports three wireless communication modes: LoRa, Wi-Fi, and Bluetooth 5 (LE). Features onboard OLED display, battery management, and Type-C USB interface. Widely used in Meshtastic and Meshcore open-source projects.

## Key Technical Details
- MCU: ESP32-S3FN8 (Xtensa 32-bit LX7 dual-core, up to 240 MHz)
- LoRa Chip: SX1262
- Max TX Power: 21±1 dBm
- Max RX Sensitivity: -134 dBm @ SF12 BW=125KHz
- Frequency Bands: 470~510MHz, 863~928MHz
- Wi-Fi: 802.11 b/g/n, up to 150Mbps
- Bluetooth: 5 (LE)
- Memory: 384KB ROM, 512KB SRAM, 16KB RTC SRAM, 8MB SiP Flash
- Display: 0.96-inch 128×64 OLED
- Battery: 3.7V lithium battery, integrated charge management
- Dimensions: 50.2 × 25.5 × 10.2 mm
- Operating Temperature: -20 ~ 70°C
- Interfaces: Type-C USB, SH1.25 battery, IPEX1.0 LoRa antenna, 2×18 header pins
- Development: Arduino, PlatformIO, ESP-IDF, MicroPython

## AGRI-GRID Citation
Heltec WiFi LoRa 32 V3 serves as the primary sensor node hardware for AGRI-GRID. Its integrated SX1262 provides long-range LoRa communication (up to 10+ km rural), while the ESP32-S3 enables local processing and Wi-Fi connectivity for gateway nodes. The onboard OLED displays real-time sensor data for field operators.
