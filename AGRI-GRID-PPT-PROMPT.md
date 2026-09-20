# AGRI-GRID — PPT DESIGN PROMPT (v1 baseline)

> Purpose: feed this entire document to a strong generative presentation model (Gamma, Claude, Gemini, or PowerPoint Designer / Copilot) and ask it to produce a 16:9 `.pptx` deck. The prompt is engineered so the model renders a judge-winning, SIH/UTKARSH-style technical deck — not generic AI slop.

---

## 0. ROLE & CONTEXT FOR THE MODEL

You are a senior presentation designer specializing in winning Indian government/student hackathon decks (Smart India Hackathon, IIT Bombay–Honeywell UTKARSH, e-Yantra). You produce clean, high-contrast, diagram-forward decks where one idea rules each slide. You NEVER write paragraphs of body text on a slide. You NEVER use 3D pie charts, gradient-mesh backgrounds, or decorative fly-in animations. You cite real data visually.

Target audience: a mixed jury of **academic faculty (IIT Bombay)** and **industry/corporate ESG judges (Honeywell)**. They reward: a clear problem, a working/demonstrable build, honest feasibility, measurable environmental/social impact, and SDG alignment. They distrust hype, buzzword stacks, and AI-generated inconsistencies.

Project being presented: **AGRI-GRID** — a LoRa 865MHz IN865 star-grid of ESP32 sensors across paddy zones that measures Alternate Wetting & Drying (AWD) water-depth, runs edge-AI anomaly detection, and quantifies methane + water-credit eligibility with an Agri-Stack-ready (sandbox/mock) farmer-identity link. Build cost ~₹15,000, 4-day build, offline-first.

---

## 1. DESIGN SYSTEM (design tokens — embed these exactly)

**Color roles (4–5 max, do not add more):**
- Background light (content slides): `#F7F7F5` (warm off-white)
- Background dark (cover + section dividers): `#0E2A1B` (deep forest green)
- Primary text / headers: `#1A2E22` (near-black green)
- Accent — primary green (growth/water): `#2E7D32`
- Accent — trust blue (data/cloud/Agri Stack): `#1565C0`
- Accent — earth/soil (paddy/ground): `#6D4C41`
- Accent — energy amber (methane/alerts/warning): `#F9A825`
- On-dark text: `#FFFFFF` (must meet ≥4.5:1 on `#0E2A1B`)
- Card / surface: `#FFFFFF` on light BG; `#13402A` on dark BG

**Contrast & accessibility:** All text ≥4.5:1 contrast (large text ≥3:1). Never encode meaning by color alone — pair with labels/icons. Aim slightly stronger than minimum because projectors eat contrast.

**Typography:**
- Headings: **Montserrat**, weight 700–800, uppercase for kickers, letter-spacing 0.01em.
- Body / captions: **Inter**, weight 400, 16–18pt.
- Pull-quotes / impact numbers: **Playfair Display** (elegant serif) for an agri/ESG premium feel.
- Type scale (modular 1.2): H1 44pt, H2 30pt, H3 21pt, body 17pt, caption 13pt.
- Embed all fonts in the .pptx so they survive the judge's machine.

**Grid & layout:** 12-column grid, consistent margins (≈5% sides). Rule of thirds for focal placement. One focal point per slide. Generous whitespace. Full-bleed only for cover/dividers/photo-impact; content slides contained. Left-align reading columns.

**Icon system:** **Lucide** outline icons, 24px grid, 2px stroke, single accent color per icon (green or blue). Never mix line + filled on one slide.

---

## 2. DECK STRUCTURE (slide-by-slide)

For every slide below: produce a layout description, the exact visual elements (diagram/chart/icon), the headline, and 2–4 power-keywords (not sentences). Use **flowcharts** for logic/architecture, **infographics** for stat stacks, **wireframes** for UI mockups, and **bar charts** for cost/comparison. Reveal multi-step flows with a step-by-step Fade, one element at a time.

### Slide 1 — Cover (dark `#0E2A1B`, full-bleed)
- Headline: **AGRI-GRID**
- Subhead: "LoRa Sensor Grid for Paddy Water & Methane Intelligence"
- Kicker: UTKARSH 1.0 · IIT Bombay × Honeywell · 2026
- Visual: minimal isometric paddy-field grid with 3 node dots pulsing toward a gateway; subtle Lucide `wifi`/`droplet` motif. No text clutter.
- Footer: Team name, Problem Statement ID, Mentor (TBD).

### Slide 2 — The Problem (light, rule-of-thirds left text / right stat stack)
- Headline: "Paddy farming is drowning in water — and methane"
- Visual: 3 KPI cards (Playfair numbers): water wasted %, methane share of agri GHG (~10–12%), farmer income loss. Plus one photo of flooded paddy with dark overlay.
- Keywords: *flooded fields · 30–50% avoidable water · methane hotspot.*

### Slide 3 — Why current tools fail (light, 3-column compare / "before")
- Headline: "Single sensors. No AWD. No proof."
- Visual: 3 muted cards (generic IoT kit, manual observation, app-only) each with a red X icon; lead-in to our grid.
- Keywords: *point-only · no spatial · no credit.*

### Slide 4 — Solution overview (light, central one-liner + 3 pillars)
- Headline: "A coordinated sensor grid that turns water data into credit"
- Visual: 3 pillar cards with Lucide icons — `radio` (LoRa grid), `brain` (edge AI), `leaf` (credit engine). One bold tagline.
- Keywords: *grid · edge-AI · AWD→credit.*

### Slide 5 — System architecture (light, layered stack diagram)
- Headline: "Star grid → cloud → Agri Stack → dashboard"
- Visual: clean layered architecture diagram (bottom→top): 3 Field Nodes → 1 LoRa Gateway → Cloud (FastAPI/ThingsBoard) → Dashboard + Agri Stack adapter. Use the accent colors per layer. Arrows show data flow.
- Keywords: *865MHz IN865 · star topology · offline-first.*

### Slide 6 — Hardware / node deep-dive (light, isometric node callout)
- Headline: "One node: ₹~2,200, months of solar life"
- Visual: isometric/node exploded callout: Heltec WiFi LoRa 32 V3, JSN-SR04T waterproof ultrasonic (water level), DS18B20 (temp), capacitive soil sensor, 18650 + 1W solar, IP65 box. Labels with Lucide `cpu`, `droplet`, `thermometer`, `battery-charging`, `sun`.
- Keywords: *IP67 sensor · IN865 · 6–10 mo battery.*

### Slide 7 — How it works (flow, dark divider or light, step reveal)
- Headline: "From field to farmer credit in 4 hops"
- Visual: horizontal 4-step flow with Morph between states: Sense (nodes) → Edge-AI (anomaly/AWD) → Cloud (aggregate + Agri Stack ID) → Dashboard + Credit estimate. Reveal one step per click.
- Keywords: *sense → infer → link → credit.*

### Slide 8 — AWD → methane → credit engine (light, the differentiator, chart)
- Headline: "Alternate Wetting & Drying cuts methane 30–50%"
- Visual: LEFT: water-depth line chart (flooded vs AWD cycle). RIGHT: donut "methane reduced X%" + gauge "credit eligibility %". Annotate the key insight.
- Keywords: *AWD · −30–50% CH₄ · credit-ready.*

### Slide 9 — Agri Stack integration (light, honest scope, flow)
- Headline: "Agri-Stack-ready: farmer identity, sandbox today"
- Visual: simple flow — sensor zone → FPO farmer ID (mock UFSI schema) → scheme eligibility. Small "honest scope" note: live API gated; we demo against schema with simulated data.
- Keywords: *UFSI schema · mock · FPO identity.*

### Slide 10 — Dashboard & alerts (light, device-frame mockup)
- Headline: "One field. Live spatial view."
- Visual: laptop/phone frame mockup of the heatmap dashboard (zone colors = water stress), alert toast, KPI strip. Use the accent palette.
- Keywords: *heatmap · alert · live.*

### Slide 11 — AI/ML component (light, diagram + small chart)
- Headline: "Edge anomaly detection, not just dashboards"
- Visual: small flow (IsolationForest on-device) + tiny bar "anomalies caught vs baseline". Lucide `activity` icon.
- Keywords: *on-device · IsolationForest · explainable.*

### Slide 12 — What makes us different (light, comparison table)
- Headline: "vs paddyAkvo & generic IoT"
- Visual: comparison table rows: grid spatial view, edge AI, Agri Stack identity, AWD→credit, cost. Our column highlighted green. Note paddyAkvo as the closest rival.
- Keywords: *grid · edge-AI · credit · ₹15K.*

### Slide 13 — Impact & SDG (light, icon grid + numbers)
- Headline: "Measurable ESG impact"
- Visual: 5 SDG icon chips (2,6,9,12,13) + 3 quantified impact stats (water saved, methane cut, farmers reached). Playfair numbers.
- Keywords: *SDG 2/6/9/12/13 · ESG · scalable.*

### Slide 14 — Feasibility & cost (light, bar + risk chips)
- Headline: "₹15K. 4 days. Honest risks."
- Visual: horizontal bar cost breakdown (Heltec, sensors, battery/solar, enclosures). Risk chips with mitigation (lead-time, range, mentor). Honesty about risks = credibility.
- Keywords: *₹14,995 · 4-day · risk-aware.*

### Slide 15 — Build roadmap (light, timeline)
- Headline: "Built in 4 days, July 12–15"
- Visual: 4-node timeline (Day1 hardware/firmware, Day2 backend, Day3 dashboard/demo, Day4 submit). Post-submission: pilot + credit onboarding.
- Keywords: *Day1–4 · submit Jul 15.*

### Slide 16 — Demo plan (dark divider, 3-step story)
- Headline: "3-minute live demo"
- Visual: 3 beats — (1) show live grid reading, (2) dashboard heatmap updates, (3) AWD→credit number computed. Story arc: problem → proof → impact.
- Keywords: *live · spatial · credit.*

### Slide 17 — Team (light, role cards)
- Headline: "Who builds it"
- Visual: 3 role cards (Hardware/Firmware, Backend/AI, Frontend/Demo) + mentor slot (TBD). Lucide `user` icons.
- Keywords: *3 members · mentor TBD.*

### Slide 18 — Closing / Ask (dark, centered)
- Headline: "Grid the paddy. Bank the carbon."
- Visual: single bold tagline + next step (mentor sign-off, submission Jul 15). Contact line.
- Keywords: *submit · scale · impact.*

---

## 2b. DATA-VIZ DO / DON'T (apply on every chart)

**DO**
- One idea per chart; annotate the single key takeaway in text.
- Bar/column for comparison; line for time-series; heatmap (sequential ramp, not rainbow) for spatial sensor data; donut ≤5 slices for share; gauge for KPI progress; sankey/flow for pipelines.
- Label axes, start Y at 0 unless a truncated axis is explicitly flagged, use the accent palette, maintain ≥3:1 contrast on chart lines/UI.
- Pair color with labels/icons (WCAG 1.4.1) — never color-only.

**DON'T**
- No 3D charts (distort perception). No pie with >5 slices. No dual/cluttered axes. No rainbow heatmaps. No "chartjunk" (excess ink). No decorative gradients under data.

## 3. STORYTELLING & JUDGE PSYCHOLOGY

- Open with the felt problem (Slide 2), not features.
- Lead every content slide with ONE message; support with a diagram or chart, never a paragraph.
- Quantify everything (water %, methane %, cost, farmers). Judges love metrics.
- Be honest about risks (Slide 14) — it signals maturity, not weakness.
- The deck supports a LIVE demo; the demo is decisive (≈50% weight). Design Slide 16 to mirror the actual demo.
- Tie explicitly to Honeywell ESG: measurable environmental/social impact + scalability to underserved communities + SDG alignment.

## 4. ANIMATION / MOTION

- One consistent slide transition: **Fade** or **Wipe**, duration <0.5s.
- Entrance: subtle Fade/Appear, offset 20–40px, ease-out, 200–350ms.
- Reveal flows (Slides 7, 9) step-by-step, one element per click.
- Use **Morph** only for the architecture evolution (Slide 5→7) if supported.
- NO decorative fly-ins, spins, or "Exciting" transitions.
- Include a static (non-animated) fallback export for sharing/print.

## 5. RENDERING INSTRUCTIONS (tell the model)

- Format: **16:9, 1920×1080**, export to **editable .pptx** (also keep a PDF).
- Apply the design tokens in Section 1 as master-slide theme (colors, fonts, grid).
- Embed all fonts. Use Lucide icons. WCAG-compliant colors.
- One focal point, one idea per slide. Generous whitespace.
- No 3D charts, no rainbow heatmaps (use sequential ramp), donut ≤5 slices, annotate the key insight on every chart.

## 6. ANTI-SLOP RULES (do NOT do these)

- No walls of text. No sentences as bullets. Power-keywords only.
- No fabricated tech stacks (do not invent databases/frameworks we don't use).
- No inconsistent facts vs the AGRI-GRID build plan (865MHz IN865, JSN-SR04T, ₹14,995, 4-day).
- No multilingual nonsense, no unrelated features.
- No gradient-mesh or photo-as-full-bg-with-low-contrast text.

---

## 7. TEMPLATE ADAPTATION (read before generating)

- UTKARSH / IIT Bombay may mandate an official slide cap or template (SIH mandates ≤6 slides for idea submission, ≤11 for finals). **If a cap exists, compress this 18-slide deck to fit:** map Cover→S1, Problem+Why-fail→S2, Solution+Architecture→S3, AWD→credit+Agri Stack→S4, Impact+Feasibility→S5, Demo+Team+Ask→S6. Keep every diagram; cut only prose.
- Always comply with the official template's title-block fields (Problem Statement ID, Team ID, Theme, Mentor). Leaving them blank loses points.
- If no template is mandated, deliver the full 18-slide deck.

## 8. REAL DATA TO PLUG INTO CHARTS (from AGRI-GRID build plan — use these exact numbers)

- **Cost breakdown (Slide 14, horizontal bar, total ₹14,995):** Heltec WiFi LoRa 32 V3 ×4 = ₹8,800; Capacitive soil sensor ×3 = ₹240; DS18B20 ×3 = ₹360; JSN-SR04T ×3 = ₹945; 18650 battery ×6 = ₹1,200; 18650 shield ×4 = ₹1,000; 1W solar ×3 = ₹750; IP65 box ×4 = ₹800; cables/misc ≈ ₹900.
- **AWD water cycle (Slide 8, line chart):** flooded (~50–100mm) vs AWD alternate wet/dry cycle; label "AWD = −30–50% methane".
- **Methane donut (Slide 8):** "CH₄ reduced ≈ 30–50%" vs continuous flooding baseline.
- **Credit gauge (Slide 8):** "credit eligibility %" driven by AWD adherence + water saved.
- **Battery (Slide 6):** 3400 mAh 18650 + 1W solar → 6–10 months (true deep sleep); Heltec quiescent can cut to 1–3 months — note honestly.
- **Range (Slide 5/6):** realistic 1–5 km in paddy (line-of-sight, 865MHz IN865, +30 dBm/1W EIRP).
- **Impact (Slide 13):** water saved (%), methane cut 30–50%, farmers reached (pilot = 1 FPO cluster). SDGs 2,6,9,12,13.

## 9. PER-SLIDE ANIMATION MAP (exact, consistent)

- Transition (all slides): **Fade**, 0.4s.
- S1 Cover: nodes pulse in sequence (3× Fade, 150ms stagger).
- S2 Problem: 3 KPI cards Fade-up left→right; photo crossfade in.
- S5 Architecture: **Morph** from single node → star grid → cloud layers as you advance.
- S7 How-it-works: 4 steps Appear one-by-one on click (Wipe right).
- S8 AWD→credit: line draws left→right; donut/gauge count-up.
- S10 Dashboard: heatmap cells fade-in by zone; alert toast slides in.
- S12 Comparison: our column highlight pulses once (Emphasis).
- S15 Roadmap: 4 timeline nodes stamp in sequence.
- S16 Demo: 3 beats Appear on click mirroring live demo.
- All others: single Fade-in of focal element. No spins, no fly-across, no sound.

## 10. PHOTO & ILLUSTRATION GUIDANCE

- Use **photography** only for human/impact moments (flooded paddy, farmer) with a `#0E2A1B` overlay at 45% for text contrast.
- Use **flat iconography + isometric/diagram illustration** for all system explanations (never photos of circuit boards as heroes).
- Keep illustration style consistent (flat, 2px stroke, accent palette) across every slide.

## 11. MASTER-SLIDE TOKEN TABLE (paste into the model's theme setup)

| Token | Value | Use |
|---|---|---|
| BG_LIGHT | `#F7F7F5` | Content slide background |
| BG_DARK | `#0E2A1B` | Cover, dividers, demo, closing |
| TEXT | `#1A2E22` | Headings + body on light |
| TEXT_ON_DARK | `#FFFFFF` | Text on dark BG |
| ACCENT_GREEN | `#2E7D32` | Primary accent (growth/water) |
| ACCENT_BLUE | `#1565C0` | Data/cloud/Agri Stack |
| ACCENT_SOIL | `#6D4C41` | Paddy/ground elements |
| ACCENT_AMBER | `#F9A825` | Methane/alerts/warning |
| CARD_LIGHT | `#FFFFFF` | Cards on light BG |
| CARD_DARK | `#13402A` | Cards on dark BG |
| FONT_HEAD | Montserrat 700–800 | Headings, kickers |
| FONT_BODY | Inter 400 | Body, captions (16–18pt) |
| FONT_QUOTE | Playfair Display | Impact numbers/pull-quotes |
| GRID | 12-column, 5% margins | All content slides |
| RATIO | 16:9 (1920×1080) | Export .pptx + .pdf |

## 12. ACCESSIBILITY CHECKLIST (verify before export)

- [ ] All text ≥4.5:1 contrast on its background (large text ≥3:1).
- [ ] Every chart line/icon ≥3:1 against BG; color never the only signal (labels/icons present).
- [ ] Fonts embedded in .pptx.
- [ ] No text on busy photos without a `#0E2A1B` 45% overlay.
- [ ] Reading order logical; no reliance on animation to convey meaning (static fallback reads fine).
- [ ] "Reduce motion" respected: animation is purposeful, not decorative.

## REFERENCES (research basis)

- SIH 2023 winning PPT (real deck): https://www.slideshare.net/slideshow/our-sih-2023-winning-ppt-for-ty-jhg-pptx/283114469
- SIH 2025 official 6-slide idea template: https://www.scribd.com/document/884917405/SIH2025-IDEA-Presentation-Format
- "Cracking SIH Slides 2–6" winner guide: https://www.scribd.com/document/918829289/Sih-Ppt-Guide
- SIH 2026 PPT template + slide table: https://thenewviews.com/sih-2026-ppt-template/
- Codehunters SIH 2025 PPT walkthrough: https://www.youtube.com/watch?v=SIb01fAjDAo
- SIH 2023 winner experience (DORA): https://dev.to/heisdinesh/smart-india-hackathon-2023-winners-471
- 2× SIH finalist lessons: https://medium.com/@abhaygzb15/how-we-made-it-to-the-smart-india-hackathon-finals-twice-d3648d68bce2
- IITB "How to present" (Biswabandan Panda): https://www.cse.iitb.ac.in/~biswa/howtopresent.pdf
- IITB–Honeywell Sustainability Hackathon (ESG themes): https://events-ihcfsi.org/
- Honeywell ESG report: https://www.honeywell.com/content/dam/honeywellbt/en/documents/downloads/hon-esg-report.pdf
- Presentation color palettes 2026 (hex): https://nen.wfglobal.org/highlights/top-presentation-color-palettes-2026-hex-codes-324361
- Montserrat + Inter/Poppins pairings: https://typematch.io/pair/montserrat-and-poppins
- Data viz chart-type guide (Esri): https://www.esri.com/arcgis-blog/products/insights/analytics/data-visualization-types
- Data viz mistakes (Toptal): https://www.toptal.com/designers/ux/data-visualization-mistakes
- Lucide icons: https://lucide.dev/icons/
- Rule of thirds layout: https://www.betterevaluation.org/tools-resources/rule-thirds-template-for-slide-layout
- 12-column grid system: https://slidebazaar.com/blog/the-invisible-grid-system-that-makes-every-slide-layout-look-intentional/
- PowerPoint transitions/animations: https://deckary.com/blog/powerpoint-transitions
- AI presentation tools comparison (Gamma/Beautiful.ai/PPT): https://nextdocs.io/compare/beautiful-ai-vs-gamma
- WCAG contrast minimum: https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html
