# SX1262 LoRa Transceiver - Technical Specifications

- **Source:** Semtech Corporation / HopeRF
- **Year:** 2021-2024
- **URL:** https://www.hoperf.com/modules/lora/sx1262.html
- **Type:** Datasheet
- **Relevance to AGRI-GRID:** The SX1262 is the core LoRa transceiver chip used in our sensor nodes, providing long-range wireless communication with ultra-low power consumption.

## Summary
The SX1262 is a sub-GHz radio transceiver from Semtech supporting LoRa modulation and FSK modulation. It operates in the 150 MHz to 960 MHz frequency range, achieving link budgets up to 170 dB with configurable spreading factors. Features include configurable bandwidth (4.17 to 812.5 kHz), spreading factors SF5-SF12, and multiple modulation schemes.

## Key Technical Details
- Frequency Range: 150 MHz to 960 MHz
- Modulation: LoRa, (G)FSK, (G)MSK
- Max TX Power: +22 dBm (SX1262)
- Max RX Sensitivity: -134 dBm (LoRa, SF12, BW=125 kHz)
- Link Budget: Up to 170 dB
- Spreading Factors: SF5 to SF12
- Bandwidth: 4.17 kHz to 812.5 kHz
- Current Consumption:
  - TX (max power): ~120 mA
  - RX: ~5 mA (single reception mode)
  - Sleep: ~1 µA (with LoRa standby)
  - Shutdown: ~200 nA
- Operating Voltage: 1.8V to 3.7V
- Interfaces: SPI (up to 16 MHz), GPIO
- Features:
  - Automatic frequency correction
  - CAD (Channel Activity Detection)
  - Long-range packet mode with CRC
  - Bitstream mode for FSK
  - Built-in DC-DC converter and LDO
  - LoRaWAN Class A/B/C compatible
- Package: QFN 6×6 mm (48-pin)

## AGRI-GRID Citation
The SX1262's 170 dB link budget and -134 dBm sensitivity enable AGRI-GRID sensor nodes to communicate across agricultural fields spanning 5-15 km. Its ultra-low sleep current (~1 µA) supports battery-powered operation for 5+ years on a single lithium cell, critical for remote farm deployments where grid power is unavailable.
