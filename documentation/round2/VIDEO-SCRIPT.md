# AGRI-GRID · Round 2 video script

Nov 8, 2026 ·&#32;

## How to use this script

One voice (Neeraj), 7:35 total, about 1,000 spoken words. The story follows one field, Field A, through one AWD cycle; every clip is tagged so you can stitch it in the edit.

**Persona.** An engineering student who built something for a real field and is honest about where it stands. Calm, clear, no hype. The farmer is never acted: only their phone and their SMS appear.

**Three lines to land (said early, shown, said again at the end)**

1. The decision happens 15 cm underground, where nobody can see.
2. Radar sees the whole farm but only the top 5 cm. The probe sees the depth.
3. When ground and space disagree, we don't average. We flag.

**Delivery.** About 135 words a minute; slower in the probe and AI beats, quicker in the hook and close. One-second silent pause after every number marked ⏸. Never say: revolutionary, game-changer, cutting-edge, seamless.

**Built vs designed (keep this exact).** Built: the gateway box (hardware video), the dashboard, the trained SAR model, the Probe Explorer. Designed and in progress: the probe and the field nodes. Simulated: all probe readings and node values.

**Resource tags**

| Tag | What it is | Where it comes from |
| --- | --- | --- |
| \[FACE\] | You on camera, eye level, window light | Phone or webcam, 1080p |
| \[HW\] | Real hardware footage | Your hardware video (box, power off, power on) |
| \[PX ch t\] | Probe Explorer clip: chapter and seconds | /probe?record=1&ch=N&t=S, screen-recorded at 1920×1080 |
| \[DASH\] | Dashboard screen recording | Your site: /dashboard and a field page |
| \[SAR\] | U-Net input chip, prediction, ground truth | Your SAR model outputs |
| \[DECK sNN\] | A slide from the Round 1 deck | Your PPT, fixed as discussed |
| \[DIAGRAM\] | A simple build-up diagram made in the edit | Canva / PowerPoint / Excalidraw |
| \[CIRCUIT\] \[BUILD-SHEET\] \[CAD\] \[PAPER\] | Stills held 2–3 s as proof shots | Build sheet PDF, schematics, CAD, paper first pages |
| \[TEXT\] | On-screen text overlay | Added in the edit |

## The script

Eleven beats, 0:00 to 7:35. Times are targets; read it aloud once with a stopwatch and trim words, never pace.

### Beat 1 · Hook · 0:00–0:25

| Time | Voice-over | Visual | On-screen text | Sound |
| --- | --- | --- | --- | --- |
| 0:00 | "India's rice paddies release about six and a half million tonnes of methane every year. ⏸" | \[PX ch1 t=0–6\] flooded paddy, bubbles rising | **6.5 million t CH₄ / year** · source: Chen et al. 2025 | Cold open, no music |
| 0:07 | "Most of it comes from one habit: keeping fields flooded all season. The fix is already known." | \[PX ch1 t=9–14\] water starts to drop | — | Soft bed starts |
| 0:15 | "The problem is, it happens fifteen centimetres underground, where nobody can see. I'm Neeraj, and this is AGRI-GRID." | \[FACE\] medium shot, then title card | **AGRI-GRID** · Team FusionForge · MIT Academy of Engineering | Short whoosh on title |

### Beat 2 · The problem · 0:25–1:15

| Time | Voice-over | Visual | On-screen text | Sound |
| --- | --- | --- | --- | --- |
| 0:25 | "Flooded soil has no oxygen, so microbes in it make methane. IRRI's answer is alternate wetting and drying, AWD: let the water drop below the surface, then flood again." | \[PX ch1 t=10–18\] time-lapse, water falling | **AWD** = alternate wetting and drying | Bed |
| 0:38 | "It saves up to thirty percent of the water, and cuts methane by up to forty-eight percent. ⏸ India grows rice on about fifty-one million hectares, so this matters." | \[DECK s02\] right half only (stat cards), or \[PX ch18 t=2–5\] | **−30% water · −48% CH₄** (IRRI) · **51.3 Mha** rice (DA&FW) | — |
| 0:50 | "But AWD has one rule: re-irrigate when the water is fifteen centimetres below the soil. ⏸" | \[PX ch1 t=19–24\] the −15 cm line on the section | **Re-irrigate at −15 cm** | — |
| 0:57 | "Today a farmer checks that by hand, with a pipe, in one spot, if he has time. Nobody buying carbon credits can verify it was done. And satellites help, but radar only sees the top five centimetres." | \[DECK s03\] left and centre panels | **Point · Manual · Unverified** | — |

### Beat 3 · The idea · 1:15–1:45

| Time | Voice-over | Visual | On-screen text | Sound |
| --- | --- | --- | --- | --- |
| 1:15 | "So AGRI-GRID connects three layers." | \[DIAGRAM\] empty frame, three slots | — | Bed drops |
| 1:18 | "Ground: a probe that reads water at four depths." | \[DIAGRAM\] green block appears: GROUND | **GROUND** | Soft click |
| 1:23 | "Space: Sentinel-1 radar over the whole farm." | \[DIAGRAM\] blue block: SPACE | **SPACE** | Click |
| 1:28 | "And AI that turns both into one decision for the farmer, and one record anyone can check." | \[DIAGRAM\] amber AI block, arrows to FARMER and EVIDENCE (or \[DECK s04\] held 4 s) | **AI → decision + evidence** | Click |
| 1:38 | "Let me show you each piece, starting underground." | \[PX ch2 t=0–4\] probe top-down | — | — |

### Beat 4 · The probe · 1:45–3:15

| Time | Voice-over | Visual | On-screen text | Sound |
| --- | --- | --- | --- | --- |
| 1:45 | "This is the probe. A twenty-five millimetre tube, 3D-printed in PETG. White above the soil, black below." | \[PX ch2 t=6–13\] names appear, pen and ruler for scale | **P1 probe** · 25 mm · PETG | Bed low |
| 1:55 | "Inside, four copper bands sit at zero to five, five to ten, ten to fifteen and fifteen to twenty centimetres." | \[PX ch2 t=16–22\] X-ray, bands labelled | **E1–E4** · 4 depths | — |
| 2:04 | "It prints in two halves. The copper goes into shallow pockets, and the halves seal with epoxy." | \[PX ch3 t=1–5\] print bed, then \[PX ch3 t=7–15\] copper, halves close | — | Click on each joint |
| 2:13 | "The plastic wall is the insulator. No metal touches the soil, so nothing corrodes, unlike the cheap two-prong sensors that rust in weeks." | \[PX ch4 t=3–7\] wall close-up, then \[PX ch4 t=12–17\] resistive sensor corroding | **1.6 mm wall = insulator** | — |
| 2:25 | "Each band is a capacitor. Its electric field reaches through the wall into the soil." | \[PX ch5 t=8–14\] field lines grow | **Fringing field** | — |
| 2:32 | "Water has a permittivity of about eighty; dry soil, about four. So as soil gets wetter, capacitance rises, and the ESP32's touch pins measure it directly. A published equation, Topp 1980, turns that into water content." | \[PX ch5 t=16–26\] zoom bubble fills with water, ε → θ curve | **Water ε ≈ 80 · soil ε ≈ 4** · Topp et al. 1980 | — |
| 2:47 | "Guard rings make sure each band reads only its own slice of soil." | \[PX ch6 t=1–14\] without guards, then with guards | **One band = one 5 cm slice** | — |
| 2:53 | "Here is one drying cycle: about ten days in a few seconds. The water strip follows the flood down. Then the bands dry, top to bottom." | \[PX ch8 t=3–26\] full time-lapse | **Simulated · illustrative rates** | Bed lifts slightly |
| 3:08 | "At minus fifteen, the node flags: irrigate. ⏸" | \[PX ch8 t=27–33\] lock, red marker, IRRIGATE NOW | **IRRIGATE NOW** | Single soft tone |

### Beat 5 · The hardware we have · 3:15–3:50

| Time | Voice-over | Visual | On-screen text | Sound |
| --- | --- | --- | --- | --- |
| 3:15 | "This is what's on our bench today." | \[FACE\] 2 s, you holding or pointing at the box | — | Bed off |
| 3:18 | "The gateway prototype: the box that sits at the farmhouse. Mains-powered, with the power module and the controller board inside." | \[HW\] box exterior, then lid open, internals, power OFF (slow pan) | **Gateway prototype · built** | Room tone only |
| 3:30 | "And here it is powered on." | \[HW\] power ON, LEDs, hold 4 s | — | — |
| 3:36 | "The probes and field nodes are being built to the design you just saw. ⏸ The node electronics follow our build sheet." | \[BUILD-SHEET\] page with hero pins 2 s → \[CIRCUIT\] 2 s → \[PX ch14 t=6–12\] node internals with power path | **Probe + nodes: in build** | Bed back, low |

### Beat 6 · The grid and the farmer · 3:50–4:40

| Time | Voice-over | Visual | On-screen text | Sound |
| --- | --- | --- | --- | --- |
| 3:50 | "In the field, every node sends its readings to that gateway over ESP-NOW, the ESP32's own radio. No Wi-Fi network, and no SIM card on each node." | \[PX ch9 t=0–7\] four nodes, packets flying | **ESP-NOW · no SIM per node** | Soft packet ticks |
| 4:02 | "Here, node B2 is losing water three times faster than its neighbours. That isn't normal drying. That's a leaking bund." | \[PX ch9 t=9–14\] B2 close-up, red marker | **B2: 3× faster drying → check the bund** | — |
| 4:12 | "The farmer never sees any of the backend. He gets one SMS, in Marathi:" | \[PX ch17 t=20–24\] phone lock screen, notification arrives (right half only, crop) | **Farmer's phone · prototype app** | Notification sound |
| 4:18 | (read aloud) "शेत सुकत आहे. २–३ दिवसांत पाणी देण्याची तयारी ठेवा." | \[PX ch17 t=25–28\] SMS thread | **"Field is drying. Plan to irrigate in 2–3 days."** | — |
| 4:24 | "One tap opens the app: today's water level, the plan, the rain forecast, and a button to call an agronomist." | \[PX ch17 t=29–36\] thumb taps, app opens | — | Tap sound |

### Beat 7 · The AI · 4:40–5:40

| Time | Voice-over | Visual | On-screen text | Sound |
| --- | --- | --- | --- | --- |
| 4:40 | "Now, where the AI does its work. Three models, each with one job." | \[PX ch17 t=4–18\] left half: pipeline cards lighting up (crop left half) | **Calibration · Anomaly · SAR** | Bed |
| 4:46 | "First, calibration: it turns raw counts into water content, fitted to oven-dried samples of local soil." | \[PX ch11 t=20–28\] cups, scale, fitted curve | **Count → θ, fitted per soil** | — |
| 4:55 | "Second, anomaly detection: an Isolation Forest compares how fast each node dries. That's how B2's leak gets caught." | \[DASH\] anomaly / evidence view, or \[PX ch9 t=10–13\] again | **IsolationForest + drying-rate comparison** | — |
| 5:05 | "Third, space. We trained a U-Net on Sentinel-1 radar to map water across whole fields. Here is a radar chip, our prediction, and the ground truth." | \[SAR\] three panels side by side: input → prediction → ground truth, 2 s each, then all three together | **U-Net · Sentinel-1 VV/VH** | — |
| 5:17 | "Per-chip mean IoU is zero point three eight. ⏸ A working first model, and the number we'll push up with more labelled fields." | \[SAR\] metrics view or a clean card | **mIoU 0.38** (per chip, clean test set) | — |
| 5:25 | "And the part I care most about: the disagreement engine. If the probe says wet and the radar says dry, we don't average them. We flag the field for a person to check. ⏸ That's what makes the record trustworthy." | \[DECK s08\] bottom half: Case A consistent vs Case B discrepancy | **Ground ≠ Space → flag, don't average** | Bed dips on "flag" |

### Beat 8 · The dashboard · 5:40–6:20

| Time | Voice-over | Visual | On-screen text | Sound |
| --- | --- | --- | --- | --- |
| 5:40 | "All of this lands on one dashboard. This is the farm view, every field coloured by its state." | \[DASH\] /dashboard overview, slow cursor over the map | — | Bed |
| 5:50 | "Open a field and you get today's decision, the four probe bands, the water history and the SMS that went out." | \[DASH\] click into a field page; scroll to Probe bands card | **Probe bands · E1–E4 + EW** | Click |
| 6:02 | "Weather comes from open data for that exact location. Field officers and farmer groups use this view; farmers just get the SMS." | \[DASH\] 48 h charts, then the 3D field | **Open-Meteo weather · node values simulated** | — |
| 6:12 | "And this explorer, which you've been watching, is part of the site too: anyone can open it and learn how the probe works." | \[DASH\] home page probe cutaway → /probe | — | — |

### Beat 9 · Where we honestly are · 6:20–6:45

| Time | Voice-over | Visual | On-screen text | Sound |
| --- | --- | --- | --- | --- |
| 6:20 | "To be clear about where we are. The gateway hardware, the dashboard and the explorer are built. The SAR model is trained. The probe is designed and being printed." | \[TEXT\] two-column card: Built ✓ / In build → | **Built:** gateway · dashboard · explorer · SAR model · **In build:** probe · field nodes | Bed off, flat |
| 6:33 | "Probe readings you saw are simulated, and the thresholds are illustrative until we calibrate in real soil. That calibration is the first job of our pilot." | same card, "Next: 7-day field pilot" appears | **Next: 7-day field pilot + calibration** | — |

### Beat 10 · Impact and scale · 6:45–7:20

| Time | Voice-over | Visual | On-screen text | Sound |
| --- | --- | --- | --- | --- |
| 6:45 | "Why this is worth building: on one hectare, IPCC defaults put continuous flooding at around a hundred and forty kilograms of methane a season, and AWD at around eighty." | \[PX ch18 t=7–12\] the IPCC formula card | **≈143 → ≈79 kg CH₄ / ha / season** (IPCC 2019 Tier 1, illustrative) | Bed returns |
| 6:57 | "Our prototype setup, three field nodes and a gateway, costs about fifteen thousand rupees." | \[DECK s05\] cost card only | **≈₹15,000 · 3 nodes + gateway** | — |
| 7:03 | "We start with farmer producer organisations, then KVK pilots, then use the same records for methane-credit verification. And the platform carries over to sugarcane, wheat and cotton." | \[DECK s09\] flow, 3 s → \[DECK s10\] crop paths, 3 s | **FPOs → KVK pilots → credit verification** | — |

### Beat 11 · Close · 7:20–7:35

| Time | Voice-over | Visual | On-screen text | Sound |
| --- | --- | --- | --- | --- |
| 7:20 | "The decision happens fifteen centimetres underground. AGRI-GRID sees it, tells the farmer, and proves it." | \[FACE\] straight to camera | **Sees it · Tells the farmer · Proves it** | Music out on last word |
| 7:30 | "I'm Neeraj Parekh, team FusionForge. Thank you." | \[DECK s01\] title slide | Mentor: Trupti Bhalerao · MIT Academy of Engineering | Silence |

## Shot list

Record everything once, generously (3 s extra each side), then cut to the script. Probe Explorer links assume the site runs locally at localhost:5173.

**Probe Explorer** (Chrome, full screen, OBS at 1920×1080, 60 fps). Add `&panels=honesty,tags,captions` for cleaner frames, or press C for a clean frame. Record each chapter whole; the seconds in the script are where to cut.

| Chapter | Link | Used in beat |
| --- | --- | --- |
| 1 The problem | /probe?record=1&ch=1&hide=2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18 | 1, 2 |
| 2 Meet the probe | /probe?record=1&ch=2 | 3, 4 |
| 3 Print and build | /probe?record=1&ch=3 | 4 |
| 4 Why nothing corrodes | /probe?record=1&ch=4 | 4 |
| 5 How it senses | /probe?record=1&ch=5 | 4 |
| 6 Guard rings | /probe?record=1&ch=6 | 4 |
| 8 One AWD cycle | /probe?record=1&ch=8 | 4 |
| 9 The grid talks | /probe?record=1&ch=9 | 6, 7 |
| 11 Calibrate it | /probe?record=1&ch=11 | 7 |
| 14 Inside the node | /probe?record=1&ch=14 | 5 |
| 17 Backend + farmer | /probe?record=1&ch=17&lang=mr | 6, 7 |
| 18 Impact | /probe?record=1&ch=18&costs=0 | 10 |

Tip: to record one chapter alone, hide the others in the ☰ menu, then press R to restart.

**Hardware \[HW\]** (already shot; trim to these)

1. Box exterior, slow push-in, 3 s. CopperCloud label covered.
2. Lid open, internals with power OFF: slow pan across the power module and the board, 5 s.
3. Plug in, LEDs come on, hold 4 s. Keep the room sound for realism.
4. Optional 2 s: your hand on the box (shows it's yours and real).

**Face cam \[FACE\]** (three takes)

1. Hook line: "The problem is, it happens fifteen centimetres underground… this is AGRI-GRID."
2. Bench line: "This is what's on our bench today." (box in frame)
3. Close: "The decision happens fifteen centimetres underground… Thank you."

Eye level, light from a window in front of you, quiet room, phone mic 30 cm away or a lapel mic.

**Dashboard \[DASH\]** (one take, slow cursor, no typing)

1. /dashboard: hover the map, 8 s.
2. Click into a field: decision card, then scroll to Probe bands, 10 s.
3. Scroll to the 48 h charts and the 3D field, 8 s.
4. Home page probe section (cutaway playing), then click Open the Probe Explorer, 6 s.

**SAR \[SAR\]**

- Pick your 2–3 clearest chips. Export input, prediction and ground truth at the same size.
- Lay them out side by side on a white card with labels: Sentinel-1 input · U-Net prediction · Ground truth.
- One metrics card: mIoU 0.38, per chip, protocol-clean test set, plus the number of test chips.

**Diagram \[DIAGRAM\]** (Beat 3)

Three blocks appear one by one, left to right: GROUND (green), SPACE (blue), AI (amber). Two arrows out of AI: FARMER (SMS) and EVIDENCE (record). Same colours every time they reappear.

**Voice-over**

Record the whole VO in one sitting, beat by beat, after the visuals are cut. Leave 0.5 s of silence at the start and end of each beat file.

## Fact sheet

Every number spoken or shown, with its source. If a judge asks "where is that from?", this is the answer.

| Claim | Value | Source | Status |
| --- | --- | --- | --- |
| India rice-paddy methane | 6.5 ± 1.0 Tg (million t) CH₄ / yr | [Chen et al. 2025, Earth's Future](https://doi.org/10.1029/2024ef005479) | Literature |
| AWD water saving | up to 30 % | [IRRI, India](https://www.irri.org/where-we-work/india) | Literature |
| AWD methane cut | up to 48 % | [IRRI, India](https://www.irri.org/where-we-work/india) | Literature |
| AWD re-irrigation point | water 15 cm below soil surface | [IRRI, India](https://www.irri.org/where-we-work/india) | Literature |
| India rice area 2024–25 | 51.27 Mha (DA&FW); 51.3 Mha (USDA FAS) | DA&FW estimates; USDA FAS | Official estimate |
| C-band SAR soil depth | roughly top 5 cm | General SAR literature (see PROBE.md research prompt Q9) | Literature, approximate |
| Water vs dry-soil permittivity | ε ≈ 80 vs ≈ 3–5 | Topp et al. 1980, Water Resources Research 16(3) | Literature |
| ε → water content | Topp equation | Topp et al. 1980 | Literature |
| Probe tube, wall, bands | 25 mm OD, 1.6 mm wall, E1–E4 at 0–5 … 15–20 cm | probe-spec.json, build sheet | Design |
| Drying cycle, threshold crossing | \~10 days, flag at −15 cm | Probe Explorer AWD model | Simulated |
| B2 drying 3× faster | 3× | Probe Explorer chapter 9 scenario | Simulated |
| SAR U-Net | per-chip mIoU 0.38, protocol-clean test set | Your SAR model results | Measured |
| Methane per hectare | ≈143 kg (flooded) vs ≈79 kg (AWD), 120-day season | IPCC 2019 Refinement Vol. 4 Ch. 5 Tier 1: EF\_c 1.19 kg/ha/day, SF\_w 0.55; confirm against Tables 5.11/5.12 | Calculation, illustrative |
| Prototype cost | ≈₹15,000 for 3 nodes + gateway | Your BOM (deck slide 05: ₹14,995) | Verify against BOM before saying |

Things never to say: "tested in the field", "accurate to X %" for the probe, "LoRa tested" (unless you really did), "verified" carbon credits.

## Pre-upload checklist

Aim to upload on 9 November, a day before the deadline.

- [ ] Site builds on your laptop (`npm install && npm run build` in frontend) and /probe plays end to end
- [ ] Surat SAR image added to frontend/public/media/sar/surat.jpg (only if you use chapter 16)
- [ ] Deck slides fixed: ESP-NOW not "LoRa tested", "RUILT" typo, target-design labels on AI images, methane figure = up to 48 %
- [ ] ₹ prototype cost checked against the BOM
- [ ] Marathi SMS line checked by a native speaker, and your pronunciation practised
- [ ] One full read-aloud with a stopwatch: lands between 7:20 and 7:45
- [ ] Every number on screen has its source line
- [ ] Honesty card (Beat 9) is in the cut
- [ ] Audio: no music under the hardware and honesty beats; music out on the last word
- [ ] Export 1080p, upload to YouTube as Unlisted, auto-captions on, check the captions for "AWD", "ESP-NOW", "IoU"
- [ ] Title: "AGRI-GRID · Ground probes + radar AI for climate-smart rice · Team FusionForge (PCCOE IGC 2026)"
- [ ] Open the link in an incognito window, then submit it on the participant dashboard

**Sources:** [IRRI, AWD in India](https://www.irri.org/where-we-work/india) · [Chen et al. 2025](https://doi.org/10.1029/2024ef005479) · Topp et al. 1980, Water Resources Research 16(3), 574–582 · IPCC 2019 Refinement, Vol. 4, Ch. 5
