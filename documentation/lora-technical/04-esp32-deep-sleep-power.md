# ESP32 Sleep Modes - Deep Sleep Power Consumption

- **Source:** Espressif Systems (ESP-IDF Documentation)
- **Year:** 2024
- **URL:** https://docs.espressif.com/projects/esp-idf/en/latest/esp32/api-reference/system/sleep_modes.html
- **Type:** Technical Documentation / API Reference
- **Relevance to AGRI-GRID:** Critical for designing power-efficient sensor nodes that must operate on battery for extended periods in agricultural fields.

## Summary
The ESP32 supports two major power saving modes: Light-sleep and Deep-sleep. In Deep-sleep, the CPUs, most RAM, and all digital peripherals are powered off. Only RTC controller, ULP coprocessor, RTC FAST memory, and RTC SLOW memory remain active. Deep-sleep supports multiple wakeup sources including timer, touchpad, external GPIO, and ULP coprocessor.

## Key Technical Details
- Deep-sleep current: ~10 µA (measured, depending on configuration)
- Light-sleep current: ~0.8 mA (varies with configuration)
- ULP Coprocessor: Can run during sleep, poll sensors, monitor ADC/GPIO
- Wakeup Sources:
  - Timer (RTC controller built-in timer, microsecond precision)
  - Touchpad
  - External GPIO (EXT0: single pin, EXT1: multiple pins)
  - ULP coprocessor
  - UART (Light-sleep only)
- Power-down Options:
  - RTC peripherals and memories configurable
  - Flash Deep Power-Down (DPD) mode for Light-sleep
  - Flash power-down for Deep-sleep
  - IO isolation to prevent leakage current
- SPI Flash in Deep-sleep: Always powered down (forced)
- Flash DPD mode: Typically below 1 µA standby current
- RTC SLOW memory: Available for storing variables across sleep cycles (RTC_DATA_ATTR)
- Auto Light-sleep: Can maintain Wi-Fi/Bluetooth connections

## AGRI-GRID Citation
AGRI-GRID sensor nodes use ESP32 Deep-sleep mode between measurement intervals. With a 15-minute sleep cycle (sensor reads for 5 seconds, then sleeps), the average current draw is approximately 15-20 µA, enabling 3+ years of operation on a 2000 mAh lithium battery. The ULP coprocessor monitors soil moisture thresholds and wakes the main CPU only when anomalies are detected, further reducing power consumption.
