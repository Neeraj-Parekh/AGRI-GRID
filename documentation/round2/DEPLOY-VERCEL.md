# Deploying the AGRI-GRID site to Vercel

One Vercel project serves the whole public site. The Probe Explorer is a route of the same Vite
app (`/probe`), not a separate build, so there is nothing to deploy twice.

**Deploy this:** `websites/2026-11-08-probe-explorer/frontend`
**Never deploy this:** `yenprotek-offline/` (reference mirror, not ours to publish)

## Option A — GitHub → Vercel (recommended)

1. Push `main` to `github.com/Neeraj-Parekh/AGRI-GRID`. The current `main` contains the
   snapshot and the local-deployment docs; the working tree has unrelated local changes that
   are not part of the site.
2. Vercel dashboard → **Add New → Project → Import Git Repository** → `AGRI-GRID`.
3. Settings:

   | Field | Value |
   |---|---|
   | Framework preset | Vite |
   | Root Directory | `websites/2026-11-08-probe-explorer/frontend` |
   | Build Command | `npm run build` (default) |
   | Output Directory | `dist` (default) |
   | Install Command | `npm ci` (default) |
   | Environment variables | none |

4. Deploy. Every push to `main` that touches that root redeploys.

`vite.config.js` switches `base` to `/` when Vercel sets `VERCEL`, and `vercel.json` rewrites
every path to `index.html`, so `/probe`, `/dashboard` and deep links survive a refresh.

Expected routes after deploy:

```
/                     story home
/probe                Probe Explorer, 18 chapters
/dashboard            operating dashboard
/fields /intelligence /evidence /hardware /reports
```

## Option B — CLI with a token

Use this when the repo should not be pushed yet, or for a preview deployment from the laptop.

```bash
cd websites/2026-11-08-probe-explorer/frontend
npx vercel link            # first run: pick the scope and create the project
npx vercel --prod          # production
npx vercel                 # preview URL
```

For non-interactive runs:

```bash
VERCEL_TOKEN=... npx vercel deploy --prod --yes \
  --cwd websites/2026-11-08-probe-explorer/frontend
```

The CLI reads the token from `VERCEL_TOKEN`; do not commit it. A token is created at
<https://vercel.com/account/tokens> with scope to the team that owns the project.

## What the deployed site can and cannot do

- **Works:** all static pages, the 3D story home, the full Probe Explorer, the dashboard in
  Demo Mode, the build sheet and probe stills if they are added to `public/`.
- **Falls back:** Live Mode calls `http://<page-host>:8001`. On Vercel that host is the public
  domain and the FastAPI server is not deployed, so the page shows the labelled
  `backend unreachable — showing demo fallback` banner. That is the honest behaviour; do not
  hide it in a recording.
- **Adds a public API later:** deploy `backend/agri_api.py` somewhere reachable (Render,
  Fly.io, a tunnel) and set `VITE_AGRI_API=https://…` as a Vercel environment variable, then
  redeploy. The frontend reads that variable at build time.

## Local verification before deploying

```bash
cd websites/2026-11-08-probe-explorer/frontend
npm ci
VERCEL=1 npm run build          # simulates the Vercel base path
python3 ../../../../agri-sites/serve.py --port 5176 \
  --root dist --fallback index.html
```

Then check `/`, `/probe`, `/dashboard`, `/models/space/sentinel6.glb` and
`/draco/draco_decoder.wasm` all return 200.

## Checklist

- [ ] `npm ci` is clean from the committed lockfile
- [ ] `VERCEL=1 npm run build` produces `dist/index.html` with `/assets/...` paths
- [ ] `dist/404.html` exists (postbuild copies `index.html`)
- [ ] Vercel root directory is the frontend folder, not the repo root
- [ ] The Yenprotek mirror is not in the repository being imported
- [ ] After deploy: open `/probe?record=1` and confirm 1920 × 1080 recording mode
