# Probe Explorer (`/probe`): pull request summary

## What this adds

- **`/probe`**, a recordable website (not a video): 18 chapters over three 3D worlds, every frame a pure function of the
  timeline. `?ch=&t=&paused=1` reproduces a frame exactly; `?record=1` gives a fixed 1920 × 1080 frame with autoplay and a
  1 s hold between chapters; **C** toggles a clean frame.
- **Parametric hardware from `probe/spec/probe-spec.json`:** P1 hero probe (two printed halves with tongue-and-groove seam,
  copper bands E1–E4 with guards in 0.15 mm pockets, EW strip, ribs, DS18B20 in its clip, coupler, tip plug, cap with EREF,
  PG7 gland, nine colour-coded wires), P2, P3 cutaway on its stand, P4 stub; N1 node box (bosses, gasket, C-clips, glands,
  perfboard on standoffs, modules, 18650); staff gauge G1; generic gateway (Prototype mains box / Field mast).
- **Worlds:** a paddy cross-section diorama whose section plane runs through the probe axis (the sectioned probe sits in its
  auger groove), water with a meniscus, leaf-strip rice, bund, stake, node and drip-loop cable; a studio bench; a four-plot
  farm with farmhouse gateway, tank and pump, and an illustrative SAR satellite; a phone held in a soft stylised hand.
- **Effects** in the AGV-4 language: field pulses, measurement sweep, lock brackets, condition markers, data packets, link
  lines, fringing-field lines on the section, circuit traces; DOM result tags; toasts and an event log.
- **HUD** in the dashboard's glass-card language; ☰ settings: show/hide any chapter, show/hide panels, hide costs,
  hardware variant, quality tier, language (English, Marathi, Hindi), copy a link to the setup.
- **Interactive:** moisture slider, exploded view, node-log replay (CSV/JSON; the honesty line switches to "Measured" with node
  and date), hover/tap spec cards, three camera modes.
- **Embeds:** home page cutaway (chapter 5 loop) and dashboard band readings (E1–E4 + EW, simulated from the field's water level).
- **Site upgrade:** three r186; story and banner scenes use leaf-strip rice, N1 node boxes on their stakes and the Prototype
  gateway; AgX tone mapping; `mountSky` / `mountStory` APIs unchanged.
- **Docs:** `probe/PROBE.md` (design, electronics, firmware, calibration, failure modes, sources, research prompt),
  `probe/RECORDING.md`, `probe/ASSETS.md`; build-sheet sources in `documentation/probe-sources/`.

## Checks

- `npm run test:probe`: 55 passing (Topp curve points, gravimetric θ, AWD model, geometry ± 0.5 mm, pin map,
  32 declared contacts ≤ 0.2 mm, no unintended intersections, support chain to the ground, cable length, floor contacts of
  lying probes).
- Visual review of every chapter in a software-rendered browser at 1280 × 720 and 1920 × 1080; contact sheet in
  `review/probe/probe-scenes-preview.jpg`.

## Still illustrative (stated on screen)

- All touch counts, θ values, thresholds and drying rates; σ⁰ values; link RSSI; calibration masses.
- The SAR panel in chapter 16 until `public/media/sar/surat.jpg` is added.
- Satellite size and altitude (not to scale); plot sizes (compact for the frame).
- Marathi/Hindi interface strings and captions should be checked by a native speaker.

## Notes for reviewers

- `package-lock.json` does not yet list `three@0.186`; `npm install` refreshes it (Vercel runs `npm install`).
- The probe engine loads only on `/probe` and, lazily, for the home cutaway.
