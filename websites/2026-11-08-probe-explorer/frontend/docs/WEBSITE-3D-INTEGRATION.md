# AGRI-GRID website: 3D, story site and decision cards

## What changed
| Route | Page |
|---|---|
| `/` | **New story site**: hero with live 3D field, problem stats, scroll-driven 3D "how it works" (6 chapters), probe, AI layers, who it helps, roadmap, evidence and team photo slots |
| `/dashboard` | Overview (was `/`) + living-sky 3D banner, today's decision, irrigation forecast, season water/methane ledger, farmer SMS preview (Marathi/Hindi/English), node health |
| `/fields/:id` | Field detail + interactive 3D field (orbit, crop stage slider, SAR layer, time of day) |
| other routes | unchanged |

## New files
```
src/three/lib.js            shared 3D builders (sky, sun position, rice, paddy, nodes, satellite, people, phone, server…)
src/three/skyScene.js       mountSky(): living-sky banner + interactive field mode
src/three/storyScene.js     mountStory(): scroll story world
src/components/three/       React wrappers: SkyBanner, Field3D, StoryScroll, useWeather (Open-Meteo)
src/components/decision/    decide.js (pure logic) + DecisionCards.jsx (+ css)
src/site/                   Home.jsx, Photo.jsx, site.css
public/media/README.md      list of photo filenames to drop in
docs/embed-3d-example.html  using the scenes on a plain HTML page (no React)
vercel.json                 SPA rewrites for Vercel
```
Modified: `App.jsx` (routes), `Layout.jsx` (Overview → /dashboard, "Project site" link), `Overview.jsx`, `FieldDetail.jsx`, `theme.css` (one media query), `index.html` (title/description), `package.json` (+ three), `vite.config.js` (base `/` on Vercel, `/AGRI-GRID/` on GitHub Pages), `.github/workflows/deploy-pages.yml` (`npm ci` → `npm install`, because the lockfile must be regenerated once).

## Run and deploy
```bash
cd frontend
npm install          # adds three; commit the updated package-lock.json
npm run dev          # http://localhost:5173/AGRI-GRID/
npm run build
```
**Vercel:** New Project → import the GitHub repo → Root Directory `frontend` → Framework "Vite" → Deploy. `vercel.json` handles client-side routes. Vercel sets `VERCEL=1`, so the site is served from `/`.
**GitHub Pages** keeps working at `/AGRI-GRID/`. After `npm install` commits a fresh lockfile you can switch the workflow back to `npm ci`.

## Photos
Drop files into `frontend/public/media/` with the names in `public/media/README.md`. Placeholders disappear automatically. Edit team names and roles in `src/site/Home.jsx`.

## Real SAR image
Pass a Sentinel-1 tile: `<StoryScroll sarImage={import.meta.env.BASE_URL + 'media/sar-tile.jpg'} />` and the same prop on `SkyBanner`/`Field3D`. Credit: "Contains modified Copernicus Sentinel data 2026".

## Honesty labels kept
Dashboard data stays SIMULATED unless Live mode is connected. The methane ledger uses IPCC Tier 1 with placeholder defaults (EF 1.19 kg CH₄/ha/day, SF_AWD 0.55, GWP 27): confirm against IPCC 2019 Refinement Tables 5.11–5.12 before quoting. Marketplace and credit integrations are labelled "Planned". The SAR layer in the 3D field is illustrative until a real tile is loaded.

## Performance
three.js loads only when a 3D view is on screen (dynamic import, ~170 KB gzipped). Scenes pause when scrolled out of view, honour `prefers-reduced-motion`, and fall back to a static gradient without WebGL.
