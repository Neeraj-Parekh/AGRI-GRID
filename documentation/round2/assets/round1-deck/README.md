# Round 1 deck — UTKARSH 1.0

The actual Round 1 submission deck, recovered from
`Users/lenovo/Downloads/satellite/sar/`. It is the **text layer** the video script calls
`[DECK sNN]`.

| File | What it is |
|---|---|
| `AGRI-GRID-UTKARSH-deck.pptx` | the newer save, 13 Jul 2026, 18 slides, 10 × 5.62 in (16:9) |
| `AGRI-GRID-UTKARSH-deck.pdf` | 12 Jul render of the earlier save, used for the slide JPEGs |
| `slides/slide-01.jpg` … `slide-18.jpg` | 1600 px wide page renders from the PDF |

Source names: `AGRI-GRID-UTKARSH-deck(2).pptx` (newer) and `AGRI-GRID-UTKARSH-deck.pdf`
(older). sha256:

```
3e283ef9842a62a8fe6939f47bcbe4746bcbed8cdf06ab2c09026dae136a1e93  AGRI-GRID-UTKARSH-deck.pptx
edc938f811df1f8f9927ca99b094b35ae13deb4b4a7e42047a583c14f55ce6c3  AGRI-GRID-UTKARSH-deck.pdf
```

The PDF is one revision older than the PPTX. The differences are small (slide 8 source
wording, slide 10 warning glyph, slide 12 line length). If exact wording matters on screen,
open the PPTX; for backgrounds and stills, the JPEGs are fine.

## The cost claim is verified here

Slide 14 is the source of the script's "about fifteen thousand rupees". It totals **₹14,995**
for the July prototype:

| Item | Qty | Cost |
|---|---|---|
| Heltec WiFi LoRa 32 V3 | 4 | ₹8,800 |
| 18650 battery | 6 | ₹1,200 |
| 18650 shield | 4 | ₹1,000 |
| JSN-SR04T ultrasonic | 3 | ₹945 |
| IP65 box | 4 | ₹800 |
| 1 W solar | 3 | ₹750 |
| Antenna 865 MHz | 4 | ₹600 |
| Cables / misc | — | ₹300 |
| DS18B20 | 3 | ₹360 |
| Capacitive soil | 3 | ₹240 |
| **Total** | | **₹14,995** |

That is 3 field nodes plus 1 gateway, exactly the setup the script describes. It is the
**July prototype** (Heltec boards, JSN-SR04T, IP65 boxes), not the V2 station (ESP32 DevKitC +
EBYTE E22 + Fibox), which is not costed anywhere in the repo. Do not put ₹14,995 next to a V2
render without saying which build it refers to.

## Slide map

| Slide | Content | Script use |
|---|---|---|
| 01 | title, AGRI-GRID / LoRa grid | 7:30 close, after replacing the `TEAM [TBD]` footer |
| 02 | problem, 30–50 % water, 10–12 % emissions | not as-is; the script uses newer IRRI numbers |
| 03 | why current tools fail: IoT kit, manual, app-only | 0:57 gap beat, matches Point · Manual · Unverified |
| 04 | solution, three pillars | 1:28 platform beat alternative |
| 05 | four-layer architecture | spare |
| 06 | node hardware and BOM | spare; July parts, not V2 |
| 07 | how it works, four hops | spare |
| 08 | AWD differentiator, −30–50 % CH₄ | spare |
| 09 | Agri Stack integration | spare |
| 10 | dashboard and alerts | spare; older dashboard, do not use as the current UI |
| 11 | IsolationForest pipeline | spare |
| 12 | competitive landscape, ₹15K build | spare |
| 13 | impact and SDG alignment | spare |
| 14 | **cost breakdown, ₹14,995** | 6:57 cost card |
| 15 | four-day build roadmap | spare |
| 16 | three-minute demo plan | spare |
| 17 | team (Neeraj, Amudullah, Riddhi) | spare; footer says mentor TBD |
| 18 | the ask | spare |

The twelve backgrounds in `../deck-visuals/` are a later editorial redesign, not this deck.
Use the deck for text and numbers, the backgrounds for full-bleed visuals, and never mix the
two numbering schemes.
