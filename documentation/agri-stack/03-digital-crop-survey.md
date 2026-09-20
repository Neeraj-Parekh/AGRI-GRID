# Digital Crop Survey and Crop Sown Registry

- **Source:** Ministry of Agriculture & Farmers Welfare / State Agriculture Departments
- **Version:** 1.0
- **Year:** 2025-2026
- **URL:** https://agristack.gov.in/
- **Type:** Methodology / Process Document
- **Relevance to AGRI-GRID:** Provides verified, season-wise crop data essential for carbon credit MRV, crop insurance, and agricultural advisory services.

## Summary
The Digital Crop Survey (DCS) is a ground-truthed, season-wise survey of crops grown on geo-referenced plots. Conducted each Kharif and Rabi season using mobile apps by trained surveyors, it creates the Crop Sown Registry with field-verified data cross-checked against ISRO satellite imagery.

## Key Points
- 28.5+ crore plots surveyed across 604 districts as of Kharif 2025
- Surveyors must be physically inside plot polygon (GPS geofence enforced, ±10 meters tolerance)
- AI validation on-device: photos verified against reported crop
- Quality assurance: 10% random supervisor review, 20% mandatory spot-check by Inspection Officers
- Data frozen after season and cross-validated with ISRO satellite imagery
- Target: Cover all 30 crore farm plots by Kharif season 2026

## Technical Details
### Data Record Format
```
Farmer ID + Farm ID + Season + Crop ID + Sown Area + Date of Sowing + Geo-tags + Irrigation Type
```

### Survey Process
1. **Pre-season (T-30 days):** Village maps and Farmer Registry data synced; surveyors assigned ~500 plots each
2. **During survey (~45 days):**
   - GPS geofence enforcement (must be inside plot polygon)
   - Crop selection from standardized dropdown (no free-text)
   - Sown area, date of sowing, irrigation type recorded
   - 3-5 geotagged photos taken
   - On-device AI crop photo validation
3. **Quality assurance:**
   - 10% random supervisor review per surveyor
   - 20% mandatory spot-check by Inspection Officers
   - Real-time coverage heatmaps and anomaly alerts
4. **Post-season:** Data frozen, cross-validated with ISRO satellite imagery, written to Crop Sown Registry

### Coverage (as of 2026)
- 15 states with >70% plot coverage
- Leading states: Maharashtra, Madhya Pradesh, Chhattisgarh, Rajasthan, Gujarat, Andhra Pradesh, Karnataka, Tamil Nadu, Telangana

## AGRI-GRID Citation
Ministry of Agriculture & Farmers Welfare. (2025). Digital Crop Survey Methodology and Crop Sown Registry. Government of India.