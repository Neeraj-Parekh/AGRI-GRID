# Snapshot — AGRI-GRID probe-explorer build, 8 Nov 2026

Source: `AGRI-GRID-probe-explorer.zip`
sha256 `d4969e79cfb5643ea194bcd5111503c014ad5127b9db41ab78616647badd7bff`
commit `6c57bd5` (archive comment). This is the newest site: the 4 Nov dashboard build plus
the `/probe` 3D story.

## What is kept here

```
frontend/                 the whole Vite + React app, source and public assets
backend/                  FastAPI adapter used by Live Mode
documentation/PROBE-EXPLORER-PR.md
documentation/probe-sources/   build sheet, diagrams.py and the six source PNGs
```

`frontend/package-lock.json` was regenerated with `npm install --package-lock-only` so that
`npm ci` works; the archive's lockfile was out of sync with its package.json.

## What was dropped, and why

The archive was a full repo snapshot. These parts duplicate the main repo or belong to a
different project and were removed from this copy to keep the commit small:

- root research/planning Markdown that already exists in the main repo,
- `ppt/` (JAL-SURAKSHA decks, not AGRI-GRID),
- `review/` (review screenshots; only `review/probe/probe-scenes-preview.jpg` was restored as
  a shot-selection contact sheet),
- `documentation/` subfolders other than `probe-sources`,
- `.github/`, `.autoresearch/`, `.obsidian/`,
- `node_modules/` and `dist/` (never committed).

Nothing is lost: the untouched archive is at
`/mnt/20265E15265DEC72/Users/lenovo/Downloads/08_Archives_and_Compressed/Backup_Files/AGRI-GRID-probe-explorer.zip`.

## Run

```bash
cd frontend
npm ci
BASE_PATH=/ npm run dev        # http://localhost:5173/probe
BASE_PATH=/ npm run build      # dist/ for static hosting or Vercel
npm run test:probe             # 55 geometry/physics tests, all passing
```

`BASE_PATH` is unset in CI: the build then uses `/AGRI-GRID/` for GitHub Pages. Vercel sets
`VERCEL`, which switches the base to `/` automatically.
