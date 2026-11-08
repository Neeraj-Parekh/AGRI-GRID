# Dashboard data: what is real and what is simulated

The dashboard (`/dashboard`) shows one of five real farming sites, plus any place you add with "Add any farm".

| Site | State | Anchor | Why |
|---|---|---|---|
| Vadgaon Maval | MH | 18.7486, 73.641 (town) | ARS Vadgaon Maval (MPKV) bred Indrayani rice; nearest paddy belt to MITAOE |
| Karjat | MH | 18.9167, 73.33 (town) | RARS Karjat (Dr. BSKKV, 1919), Konkan rice |
| KVK Baramati | MH | 18.1439, 74.5299 (campus, from ADT's own map link) | Sugarcane, "Farm of the Future" AI pilot |
| V.C. Farm, Mandya | KA | 12.5198, 76.8673 (locality) | Cauvery-canal paddy, AICRP rice centre |
| AAU Anand | GJ | 22.5358, 72.9747 (campus) | Kharif paddy then rabi wheat |

## Live, fetched in the browser (no API keys)
- Field boundaries: OpenStreetMap farmland/paddy/orchard/meadow ways via Overpass (densest cluster of up to 8 near the anchor). If OSM has none, dashed approximate plots are shown and labelled. "Trace field" lets you click a real boundary on the imagery.
- Weather, rain, ET0, soil moisture, temperature: Open-Meteo (15-min refresh).
- Soil texture, pH, organic carbon, bulk density: ISRIC SoilGrids.
- 30-day rain and solar: NASA POWER.
- Imagery: Esri World Imagery, Sentinel-2 cloudless 2023 (EOX, non-commercial), CARTO/OSM, MODIS NDVI (NASA GIBS).
- Crop and stage today: region crop calendars in `src/data/sites.js`.
All cached in localStorage so the demo opens offline after one visit.

## Simulated until nodes are deployed
Node readings, paddy water level (rain − ET0 balance + fixed per-field offset), per-field NDVI, one bund-leak anomaly per farm. Labelled in the UI.

## Google Maps
Google satellite tiles need a paid key, so each field links out to Google Maps / Earth at its centroid.
