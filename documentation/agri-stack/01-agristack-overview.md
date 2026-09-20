# AgriStack: Digital Public Infrastructure for Agriculture

- **Source:** Ministry of Agriculture & Farmers Welfare, Government of India
- **Version:** 2.0 (InDEA 2.0 compliant)
- **Year:** 2024-2026
- **URL:** https://agristack.gov.in/
- **Type:** Policy / Architecture Document
- **Relevance to AGRI-GRID:** Core infrastructure for farmer identity, land records, and crop data that enables credit scoring and carbon credit MRV.

## Summary
AgriStack is a federated, consent-driven data exchange protocol for Indian agriculture, built on India's Digital Ecosystem Architecture (InDEA 2.0). It functions as "UPI for agriculture" - creating rails to securely share farmer data with permission, rather than centrally storing it. The system answers three fundamental questions: Who is the farmer? Where is the land? What crop is growing?

## Key Points
- Federated architecture: States own and maintain registries; Centre provides API standards and exchange layer
- Open API by default: All access through standardized REST APIs via Unified Farmer Service Interface (UFSI)
- Privacy by Design: DPDP Act 2023 compliance baked into design with DEPA-compliant Consent Manager
- As of 2026: 8.48+ crore Farmer IDs generated across India
- 28.5+ crore plots surveyed across 604 districts under Digital Crop Survey
- ₹2,817 crore Digital Agriculture Mission funding

## Technical Details
- Built on InDEA 2.0 principles: Federated, Open API, Privacy by Design, Mobile First, Cloud First
- Three foundational registries (Golden Triangle):
  1. Farmer Registry (FrUID - 11-digit unique identifier with Verhoeff checksum)
  2. Geo-Referenced Village Maps Registry (Farm ID - 14-character identifier)
  3. Crop Sown Registry (season-wise, ground-truthed data)
- States are legal custodians of registry data
- Data never stored centrally; rails created for secure sharing with farmer permission

## AGRI-GRID Citation
Ministry of Agriculture & Farmers Welfare. (2024). AgriStack: Digital Public Infrastructure for Agriculture. Government of India. https://agristack.gov.in/