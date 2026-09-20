# ESP32 Wi-Fi & Bluetooth SoC - Technical Overview

- **Source:** Espressif Systems
- **Year:** 2024
- **URL:** https://www.espressif.com/en/products/socs/esp32
- **Type:** Product Page / Technical Overview
- **Relevance to AGRI-GRID:** The ESP32 is the main MCU in our sensor and gateway nodes, providing Wi-Fi, Bluetooth, and computational capabilities for edge processing.

## Summary
ESP32 is a feature-rich Wi-Fi and Bluetooth SoC for IoT applications. It integrates dual-mode Wi-Fi (802.11 b/g/n) and Bluetooth (Classic + BLE) with a dual-core Xtensa LX6 processor. Features ultra-low power consumption, high integration with antenna switches, RF balun, power amplifier, and LNA. Suitable for mobile devices, wearables, and IoT applications.

## Key Technical Details
- Processor: Dual-core Xtensa LX6, up to 240 MHz
- Memory: 520 KB SRAM, external PSRAM support (up to 8 MB)
- Wi-Fi: 802.11 b/g/n (2.4 GHz), up to 150 Mbps
- Bluetooth: v4.2 BR/EDR + BLE
- Operating Temperature: -40°C to +125°C
- Ultra-Low Power Modes:
  - Active: ~80-240 mA (Wi-Fi active)
  - Modem Sleep: ~15-20 mA (Wi-Fi connected)
  - Light Sleep: ~0.8 mA
  - Deep Sleep: ~10 µA
  - Hibernation: ~5 µA
- Peripherals:
  - 34 GPIO pins
  - 12-bit ADC (18 channels)
  - 2× 12-bit DAC
  - Touch sensing (10 channels)
  - 3× UART, 2× I2C, 2× SPI
  - CAN 2.0
  - SD/SDIO/MMC
  - I2S audio
- Security: Hardware crypto (AES, SHA, RSA, ECC), secure boot, flash encryption
- Development: ESP-IDF, Arduino, MicroPython, PlatformIO
- Package: QFN48 (6×6 mm) or modules (ESP32-WROOM-32E, ESP32-WROVER-E)

## AGRI-GRID Citation
The ESP32 serves as the computational core in AGRI-GRID sensor nodes and gateway devices. Its dual-core architecture allows one core to handle LoRa communication while the other processes sensor data locally (IsolationForest anomaly detection). The deep sleep capability enables battery-powered operation, while Wi-Fi provides internet connectivity at gateway nodes for data upload to ThingsBoard cloud platform.
