# Websites — three builds, one laptop

This folder holds the **latest AGRI-GRID website source** (the probe-explorer build) plus the
inventory for the other two sites that are served locally. The large, reference-only
Yenprotek mirror is deliberately **not** committed here.

## What is running

All four servers are started by `../../agri-sites/start-all.sh` (the `agri-sites` folder is a
sibling of this repo, outside git, because the Yenprotek mirror alone is 160 MB).

| # | Site | Local URL | Source | Publishable? |
|---|---|---|---|---|
| 1 | AGRI-GRID website (4 Nov build) | http://localhost:5173/ | `agri-grid-website-backup.zip` | yes — our own React source |
| 2 | Probe Explorer (8 Nov build) | http://localhost:5174/probe | `AGRI-GRID-probe-explorer.zip` | yes — our own React source |
| 3 | Yenprotek offline mirror | http://localhost:8090/en/index.html | `yenprotek-offline.zip` | **no** — derivative reference only |
| — | Landing page for all three | http://localhost:8080/ | `agri-sites/landing/` | local only |
| — | Live-mode API | http://localhost:8001/agri/fields | `agri-sites/agri-grid-probe/backend/` | yes — FastAPI, CORS open |

The landing page is the bookmark to give someone: it links to the story home, the dashboard,
the probe chapters and the mirror.

### Why the Yenprotek mirror must stay local

It is a rebranded copy of `yenprotek.com`. The photography, case studies and copy are not ours
to publish. Keep it on the laptop as a visual reference for framing, lighting and section
order; never add it to a Vercel project or the submission repo.

## The latest build (this folder)

`2026-11-08-probe-explorer/` is a complete source snapshot of commit `6c57bd5`, taken from
`AGRI-GRID-probe-explorer.zip` (sha256 `d4969e79…7bff`). It is the 4 Nov dashboard build plus
the Probe Explorer at `/probe`.

```
frontend/                 Vite + React app
  src/site/               public story home  (/)
  src/pages/              dashboard routes   (/dashboard, /fields, …)
  src/probe/              Probe Explorer     (/probe)
  src/three/              field / story 3D scenes
  public/models/          5.3 MB of GLB assets used by the probe
documentation/probe-sources/   build sheet, diagrams.py, source PNGs
documentation/PROBE-EXPLORER-PR.md
```

Build and run it by hand:

```bash
cd websites/2026-11-08-probe-explorer/frontend
npm ci                  # or npm install
BASE_PATH=/ npm run build
npm run dev             # http://localhost:5173
```

`BASE_PATH=/` builds for a domain root (Vercel, localhost). Leave it unset to build for
GitHub Pages at `/AGRI-GRID/`, which is what the existing deploy workflow does.

### Routes worth filming

| Route | What it shows |
|---|---|
| `/` | story home, live 3D field, day/night switch |
| `/probe` | 13-chapter 3D story of the probe |
| `/probe?record=1` | fixed 1920×1080 recording frame, HUD on |
| `/probe?record=1&ch=5&t=12&paused=1` | one chapter paused on a chosen second |
| `/probe?record=1&quality=low` | lower GPU load while recording |
| `/dashboard` | the operating dashboard |
| `/fields`, `/intelligence`, `/evidence`, `/hardware` | the evidence chain |

Recording help is in `frontend/src/probe/RECORDING.md`; the chapter map, keys and still-frame
links are there.

## The 4 Nov build

Source: `agri-grid-website-backup.zip` (sha256 `7b0ade0f…957d`, 15 MB, excludes node_modules).
It is the same app without `src/probe/`, and is kept as a rollback point. It is deployed at
http://localhost:5173/ from the extracted copy in `../../agri-sites/agri-grid-current/`.

## Vercel

One project is enough for both publishable builds, because the probe is a route of the same
app, not a separate app.

1. Push this repo to GitHub (`Neeraj-Parekh/AGRI-GRID`).
2. In Vercel: **Add New → Project → import the repo**.
3. Set **Root Directory** to `websites/2026-11-08-probe-explorer/frontend`
   (or `frontend` after the snapshot is merged into the main app).
4. Framework preset **Vite**. Build `npm run build`. Output `dist`.
5. No environment variables are required. `vite.config.js` already switches `base` to `/`
   when `VERCEL` is set, and `vercel.json` rewrites every path to `index.html` so
   `/probe`, `/dashboard` and deep links survive a refresh.

Do **not** import the Yenprotek mirror. If a second public demo is wanted, point a second
Vercel project at the 4 Nov build instead.

## Local service control

```bash
cd /mnt/20265E15265DEC72/study/CODE/HACKATHON/agri-sites
./start-all.sh      # landing 8080 · AGRI-GRID 5173 · probe 5174 · yenprotek 8090 · API 8001
./stop-all.sh
tail -f run/*.log
```

The servers bind `0.0.0.0`, so a phone on the same Wi-Fi can open
`http://<laptop-ip>:8080`. They do not survive a reboot; run `start-all.sh` again (or add it
to the desktop autostart).

## Asset provenance

| Archive | sha256 | Used for |
|---|---|---|
| `AGRI-GRID-probe-explorer.zip` | `d4969e79cfb5643ea194bcd5111503c014ad5127b9db41ab78616647badd7bff` | probe source, newest site |
| `agri-grid-website-backup.zip` | `7b0ade0ff6dedf320d8b3a0c742f03259505207172fe864787a597afcdf8957d` | 4 Nov site, rollback |
| `yenprotek-offline.zip` | `326f355d6df4e4046a8c873384b7f87ca4525a2289deb2bf9182c5efc168abf7` | reference mirror, never publish |

Screenshots of each running site are in `../../agri-sites/screenshots/` and can be used as
thumbnails in the video index without re-recording.
