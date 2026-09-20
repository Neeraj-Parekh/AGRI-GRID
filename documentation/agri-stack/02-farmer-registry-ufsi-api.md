# Farmer Registry and Unified Farmer Service Interface (UFSI)

- **Source:** Ministry of Agriculture & Farmers Welfare / AgriStack Technical Team
- **Version:** v1.0
- **Year:** 2025-2026
- **URL:** https://agristack.gov.in/
- **Type:** API Documentation / Schema
- **Relevance to AGRI-GRID:** UFSI APIs enable farmer verification, land record validation, and crop history retrieval essential for credit scoring and carbon credit project enrollment.

## Summary
The Farmer Registry assigns each farmer a unique FrUID (11-digit number with Verhoeff checksum) linked to Aadhaar, PM-KISAN, PMFBY, and bank details. The Unified Farmer Service Interface (UFSI) is the API gateway with three components: API Specifications Layer (OpenAPI 3.0), Network Manager, and Access Manager (OAuth 2.0).

## Key Points
- FrUID is the primary farmer key (not phone or Aadhaar) - portable across states
- Name Match Score powered by C-DAC for deduplication (≥80 auto-approved, 31-79 manual review, ≤30 rejected)
- Multi-script transliteration across 22 Indian languages
- Farm ID: 14-character string (2 state code + 11 random + 1 checksum)
- Consent Manager: DEPA-compliant, granular, revocable consent with immutable audit trails
- Sandbox: 10,000+ synthetic farmers, 50,000+ plots, 100% API parity with production

## Technical Details
### Key API Endpoints
| Endpoint | Method | Scope Required |
|----------|--------|----------------|
| `/v1/farmers/{frUID}` | GET | farmer:read:basic |
| `/v1/farmers/{frUID}/land-holdings` | GET | land:read:ownership |
| `/v1/plots/{farmID}` | GET | land:read:geometry |
| `/v1/crops/plots/{farmID}/seasons/current` | GET | crop:read:current |
| `/v1/crops/history/{farmID}` | GET | crop:read:history |
| `/v1/consent/request` | POST | consent:write |
| `/v1/consent/status/{requestID}` | GET | consent:read |

### Authentication
- OAuth 2.0 Client Credentials flow
- JWT access token (60-minute TTL)
- Consent Artefact required for private farmer data
- Production rate limits: Tier 1 (1,000 req/min), Tier 2 (10,000 req/min), Tier 3 (100,000 req/min)

## AGRI-GRID Citation
AgriStack Technical Team. (2025). Unified Farmer Service Interface (UFSI) API Specifications v1.0. Ministry of Agriculture & Farmers Welfare, Government of India.