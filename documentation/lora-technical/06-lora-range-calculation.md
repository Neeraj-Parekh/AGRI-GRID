# LoRa Range Calculation - Path Loss and Link Budget

- **Source:** Semtech / LoRa Alliance Technical Documentation
- **Year:** 2023
- **URL:** https://lora-alliance.org/resource_hub/lorawan-regional-parameters-v1-0/
- **Type:** Technical Reference / Application Note
- **Relevance to AGRI-GRID:** Enables accurate prediction of LoRa communication range in agricultural environments for sensor node placement planning.

## Summary
LoRa range is determined by the link budget, which is the difference between transmitted power and receiver sensitivity. The SX1262 achieves up to 170 dB link budget. Path loss in agricultural environments follows modified free-space path loss (FSPL) with terrain correction factors. Typical ranges: 2-5 km urban, 10-15 km suburban, 20+ km rural/open field.

## Key Technical Details
- Link Budget Formula: LB = PTX + GTX - FSPL(d,f) + GRX
  - PTX: Transmit power (dBm)
  - GTX: TX antenna gain (dBi)
  - GRX: RX antenna gain (dBi)
  - FSPL: Free-space path loss (dB)
- Free-Space Path Loss: FSPL(dB) = 20*log10(d) + 20*log10(f) + 20*log10(4π/c)
  - d = distance (meters)
  - f = frequency (Hz)
  - c = speed of light (3×10^8 m/s)
- FSPL at 868 MHz for 1 km: ~91.7 dB
- FSPL at 868 MHz for 10 km: ~111.7 dB
- SX1262 Link Budget: 170 dB (max)
- Spreading Factor Impact:
  - SF7: ~125 dB sensitivity, highest data rate, shortest range
  - SF12: ~137 dB sensitivity, lowest data rate, longest range
- Environmental Factors for Agriculture:
  - Free space: -20 dB/decade distance
  - Vegetation attenuation: 0.1-0.5 dB/m (crop dependent)
  - Ground reflection: -6 dB at grazing angles
  - Rain fade: Negligible at sub-GHz
- Fresnel Zone Clearance: First Fresnel zone should be 60% clear for reliable link
- Typical Agricultural Ranges (IN865, SF12, 125kHz BW):
  - Flat open field: 10-15 km
  - Light vegetation: 5-10 km
  - Dense crops (corn, sugarcane): 3-5 km
  - Hilly terrain: 2-5 km (depends on line-of-sight)

## AGRI-GRID Citation
AGRI-GRID uses link budget analysis to plan sensor node placement. For a typical 10-hectare farm with flat terrain, we place gateway nodes to achieve 99.9% packet delivery ratio (PDR) using SF7-SF9. For edge nodes at 5+ km distance, we use SF10-SF12 to maintain reliable communication. The link budget of 170 dB provides sufficient margin for crop growth throughout the growing season.
