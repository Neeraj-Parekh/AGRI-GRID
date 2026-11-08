# AGRI-GRID website — run guide

## Deployed on this laptop (8 Nov 2026)

Three sites are already built and served; `agri-sites/start-all.sh` starts them and the
`agri-sites` systemd user unit restarts them at login.

| Site | URL |
|---|---|
| Landing page for all three | http://localhost:8080/ |
| AGRI-GRID website, newest build (8 Nov) | http://localhost:5173/ (dashboard `/dashboard`, probe `/probe`) |
| Previous build (4 Nov), rollback only | http://localhost:5174/ |
| Yenprotek reference mirror (never publish) | http://localhost:8090/en/index.html |

Full inventory, provenance and the Vercel settings are in `websites/README.md`. The sections
below describe running the source in `frontend/` by hand.

## Frontend (full product, Demo + Live)
```
cd frontend
npm install
npm run dev        # http://localhost:5173
npm run build      # production → dist/
npm run preview    # serve dist
```
Routes: `/` Overview · `/fields` · `/fields/AGRI-001` · `/intelligence` · `/evidence` · `/evidence/:id` · `/hardware` · `/reports` · `/settings`

Demo Mode (default): deterministic seed-42 data in `src/data/demo.js`, labelled SIMULATED.
Live Mode: header toggle → fetches `VITE_AGRI_API` (default `http://localhost:8001`), falls back to demo with badge if offline.

## Backend (new AGRI adapter; old JAL files untouched)
```
/mnt/.../linux_venv/bin/python -m uvicorn agri_api:app --port 8001 --host 127.0.0.1
# GET /agri/fields /agri/fields/AGRI-001 /agri/nodes /agri/telemetry?fieldId=AGRI-001&nodeId=B2 /agri/alerts /agri/evidence
```

## Node-to-dashboard chain (pour-water video — film against this, not Demo Mode)
```
# 1. Start the API, then post a packet as the gateway would:
curl -X POST http://127.0.0.1:8001/agri/ingest -H 'Content-Type: application/json' \
  -d '{"fieldId":"AGRI-001","nodeId":"B2","water":1.1,"moisture":38,"temp":30.4,"batt":75,"rssi":-79}'
# 2. Verify it stored: curl http://127.0.0.1:8001/agri/nodes  (B2 now shows 1.1 cm, status alert)
# 3. Open the site, toggle Live → Overview/Fields/FieldDetail show the posted values with LIVE badges.
# Store is in-memory (resets on restart); SAR/weather stay SIMULATED.
```

## Demo path (2 min)
Overview → AGRI-001 → Node B2 (4cm drop) → Intelligence (Detect/Infer/Predict) → Evidence (EV-2026-0142 consistent vs EV-2026-0139 discrepancy) → Hardware → Reports print/download.
