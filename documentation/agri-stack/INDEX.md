# Agri Stack Documentation Index

## Overview
This folder contains official documentation on India's Agri Stack - the Digital Public Infrastructure for agriculture that provides farmer identity, land records, and crop data through standardized APIs.

## Files

| File | Title | Source | Type | Relevance |
|------|-------|--------|------|-----------|
| [01-agristack-overview.md](01-agristack-overview.md) | AgriStack: Digital Public Infrastructure for Agriculture | Ministry of Agriculture & Farmers Welfare | Policy/Architecture | Core infrastructure for farmer identity, land records, and crop data |
| [02-farmer-registry-ufsi-api.md](02-farmer-registry-ufsi-api.md) | Farmer Registry and Unified Farmer Service Interface (UFSI) | AgriStack Technical Team | API Documentation | UFSI APIs for farmer verification, land validation, crop history |
| [03-digital-crop-survey.md](03-digital-crop-survey.md) | Digital Crop Survey and Crop Sown Registry | Ministry of Agriculture / State Departments | Methodology | Season-wise verified crop data for MRV |
| [04-indea-consent-manager.md](04-indea-consent-manager.md) | InDEA 2.0 and Consent Manager Architecture | MeitY / MoAFW | Architecture | Consent framework for farmer data access |

## Key Concepts for AGRI-GRID

### FrUID (Farmer Unique Identifier)
- 11-digit number with Verhoeff checksum
- Linked to Aadhaar, PM-KISAN, PMFBY, bank details
- Primary farmer key (not phone or Aadhaar)
- Portable across states

### Farm ID
- 14-character string: 2 state code + 11 random + 1 checksum
- Linked to GeoJSON polygon (plot shape)
- Carries owner name, land extent, soil type, irrigation source

### UFSI API Gateway
- OAuth 2.0 authentication
- Consent Artefact required for private data
- OpenAPI 3.0 specifications
- Rate limits: 1,000-100,000 req/min based on tier

### Consent Manager
- DEPA-compliant (Data Empowerment and Protection Architecture)
- Granular, revocable consent
- Data blind (only sees metadata)
- Immutable audit trails (7-year retention)

## Data Sources
- agristack.gov.in (official portal)
- prodcx.com (developer guide)
- growthgurukul.in (startup guide)
- indianexpress.com (policy explainer)

## Last Updated
July 2026