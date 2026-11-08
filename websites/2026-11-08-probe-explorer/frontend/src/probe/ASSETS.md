# Probe Explorer assets and credits

Everything in `/probe` is modelled in code from `spec/probe-spec.json` and `spec/layout.js` (probe P1–P4, node box N1,
staff gauge G1, gateway, farmhouse, tank and pump, satellite, phone, hand, rice, soil, water). No third-party models
are used, and no third-party branding appears on any modelled box.

| File | Asset | Source | Licence |
|---|---|---|---|
| `public/models/hdri/forest_slope_1k.hdr` | Forest slope HDRI, used only as image-based lighting in the field and farm worlds | Poly Haven (via pmndrs/market-assets) | CC0 |
| `public/fonts/NotoSansDevanagari.ttf` | Noto Sans Devanagari, for Marathi and Hindi text on the phone screen and in SMS cards | Google Fonts / Noto project | SIL OFL 1.1 (`public/fonts/OFL-NotoSansDevanagari.txt`) |
| procedural | Soil horizons, roots, pebbles, mud, bund earth, water ripples, FDM layer lines, brushed steel, perfboard, module PCBs, gauge face, tiles, plaster | Generated on a canvas at load time with seeded noise (`core/textures.js`) | Own work |
| procedural | Rice (leaf-strip tillers), hand (signed-distance surface + capsules), all hardware | `world/*.js`, `models/*.js` | Own work |
| optional | `public/media/sar/surat.jpg`: the team's Sentinel-1 figure for chapter 16. Until it is added, a labelled synthetic placeholder is drawn. | Team / ESA Copernicus data | Copernicus Sentinel data terms |

Module PCBs carry only generic part names (ESP32, TP4056, HT7833, INA219, SIM800L, RELAY), drawn as silkscreen text.
