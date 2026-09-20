# InDEA 2.0 and Consent Manager Architecture

- **Source:** Ministry of Electronics & Information Technology / Ministry of Agriculture
- **Version:** 2.0
- **Year:** 2024-2026
- **URL:** https://agristack.gov.in/
- **Type:** Architecture Specification
- **Relevance to AGRI-GRID:** Consent framework governs how farmer data can be accessed for credit scoring, carbon credit projects, and other value-added services.

## Summary
AgriStack is built on InDEA 2.0 (India's Digital Ecosystem Architecture) with a DEPA-compliant Consent Manager based on the same Data Empowerment and Protection Architecture used in India's Account Aggregator framework. The Consent Manager is data blind - it never sees actual data, only metadata about what was consented to.

## Key Points
- DEPA-compliant Consent Manager (Data Empowerment and Protection Architecture)
- Consent is granular: farmers choose specific data fields, purpose, and duration (max 1 year default)
- Consent is revocable: instant access cutoff when farmer revokes
- Consent Manager is data blind: only sees metadata, not actual data
- Immutable audit trails with 7-year retention
- DPDP Act 2023 compliance built into design

## Technical Details
### Consent Flow
1. Platform initiates consent request via UFSI API
2. Farmer receives push notification on Consent Manager app
3. Farmer approves with specific data fields, purpose, and duration
4. Platform receives signed Consent Artefact (digitally signed JSON document)
5. Consent Artefact passed as header in every UFSI API call accessing personal data

### Data Governance Rules
- Cannot resell raw registry data
- Need consent for every use (no "one-time KYC and done")
- Aggregated analytics require k-anonymity (k ≥ 50, ideally k ≥ 100)
- State approval may be required for commercial use (Agriculture is State Subject)
- Immutable logs of every API call and consent artefact for 7 years

### Integration with Other Systems
- AgriStack → K-DSS (Krishi Decision Support System): Plot geometry + crop sown + farmer ID feeds analytics
- AgriStack → eNAM: Verified crop data auto-lists produce at harvest
- AgriStack → NPSS: Spatial data identifies farmers in outbreak radius
- AgriStack → PM-KISAN / PMFBY: FrUID as common key for scheme eligibility

## AGRI-GRID Citation
MeitY & MoAFW. (2024). InDEA 2.0 Architecture and Consent Manager Framework for AgriStack. Government of India.