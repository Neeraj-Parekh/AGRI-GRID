# AGRI-GRID website — run guide

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
# GET /agri/fields /agri/fields/AGRI-001 /agri/alerts /agri/evidence POST /agri/ingest
```

## Demo path (2 min)
Overview → AGRI-001 → Node B2 (4cm drop) → Intelligence (Detect/Infer/Predict) → Evidence (EV-2026-0142 consistent vs EV-2026-0139 discrepancy) → Hardware → Reports print/download.
