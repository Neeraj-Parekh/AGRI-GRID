# LoRaWAN Regional Parameters - India Frequency Plan (IN865)

- **Source:** LoRa Alliance
- **Year:** 2016-2024
- **URL:** https://lora-alliance.org/resource_hub/lorawan-regional-parameters-v1-0/
- **Type:** Specification / Standard
- **Relevance to AGRI-GRID:** Defines the legal frequency bands and operational parameters for LoRaWAN deployment in India, which AGRI-GRID must comply with for regulatory approval.

## Summary
The LoRa Alliance Regional Parameters define country-specific frequency plans, data rates, power limits, and duty cycles for LoRaWAN networks. India uses the IN865-867 band (865-867 MHz ISM band), which is allocated by WPC (Wireless Planning and Coordination) for license-free use. The specification covers uplink/downlink channels, maximum EIRP, duty cycle restrictions, and data rate configurations.

## Key Technical Details
- India Frequency Band: IN865-867 (865-867 MHz)
- Sub-bands:
  - 865.0625 MHz - 865.4025 MHz (DR0-DR5)
  - 865.985 MHz - 866.385 MHz (DR0-DR5)
  - 867.185 MHz - 867.525 MHz (DR0-DR5)
- Max EIRP: 30 dBm (1W) for India
- Duty Cycle: No mandatory duty cycle restriction in India (unlike EU868)
- Data Rates (India):
  - DR0: LoRa SF12/BW125 (250 bps)
  - DR1: LoRa SF11/BW125 (440 bps)
  - DR2: LoRa SF10/BW125 (980 bps)
  - DR3: LoRa SF9/BW125 (1760 bps)
  - DR4: LoRa SF8/BW125 (3125 bps)
  - DR5: LoRa SF7/BW125 (5470 bps)
- Max Payload: 51 bytes (DR0-DR2), 115 bytes (DR3-DR5)
- ADR (Adaptive Data Rate) supported
- RX1 window offset: 1 second after TX

## AGRI-GRID Citation
AGRI-GRID operates on IN865-867 MHz band per Indian regulatory requirements. The absence of mandatory duty cycle allows continuous sensor transmission during critical irrigation windows. We use DR0-DR3 for sensor uplinks (soil moisture, pH, temperature) and DR5 for gateway downlinks (valve control commands), ensuring reliable two-way communication across the agricultural field network.
