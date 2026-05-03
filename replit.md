# Monomax – Home Cinema

## Overview

pnpm workspace monorepo using TypeScript. Personal movie library desktop app: scans a Windows movies folder, fetches IMDb metadata via OMDb API, plays movies in VLC. Packaged as a Windows Electron `.exe` installer.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: SQLite via Node.js built-in `node:sqlite` (no native deps) + Drizzle ORM (`sqlite-proxy` adapter)
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **Build**: esbuild (ESM bundle for API server, CJS bundle for Electron)
- **Desktop packaging**: Electron 36 + electron-builder (NSIS Windows installer)

## Artifacts

- `artifacts/movie-library` — React + Vite frontend (preview path `/`)
- `artifacts/api-server` — Express backend (preview path `/api`)
- `artifacts/electron` — Electron main process + Windows packaging

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm --filter @workspace/api-server run dev` — run API server locally
- `cd artifacts/electron && node build.mjs` — compile Electron esbuild bundles
- `cd artifacts/electron && pnpm run build:win` — full Windows installer (run on Windows)

## Database (SQLite via node:sqlite)

Uses Node.js 22+ built-in `node:sqlite` (DatabaseSync). No `better-sqlite3` or native packages needed. The Drizzle `sqlite-proxy` async adapter wraps the synchronous calls. Tables auto-created on startup via `sqlite.exec()`.

**Schema: movies** — id, title, year, imdbId, plot, imdbRating, genre, director, writer, actors, poster, folderName (unique), folderPath, notFound (bool), watched (bool), userRating (int 1-5), notes, createdAt

**Schema: settings** — id, moviesDir, vlcPath, omdbApiKey

Idempotent column migrations are run after `CREATE TABLE IF NOT EXISTS` via `ALTER TABLE ... ADD COLUMN` wrapped in try/catch.

## Frontend Pages

- `/` — Library grid with search + filters (title, genre, director, actor, year, min rating, watched status)
- `/scan` — Scans movies folder, looks up new folders on OMDb, shows results table
- `/stats` — Library stats: totals, watched count, avg rating, genre breakdown, top rated, recently added
- `/movies/:id` — Movie detail: poster, synopsis, IMDb rating, cast, director, watched toggle, star rating, notes, Play in VLC, Open folder
- `/settings` — Movies folder path, VLC path, OMDb API key

## Backend Routes

- `GET /api/healthz`
- `GET /api/movies` — List with filters: search, genre, director, actor, year, minRating, watched, sort
- `GET /api/movies/stats`
- `POST /api/movies/scan` — Scan folder, fetch OMDb for new entries
- `GET /api/movies/:id`
- `DELETE /api/movies/:id`
- `PATCH /api/movies/:id/update` — Update watched, userRating, notes
- `GET /api/movies/:id/subtitles`
- `POST /api/movies/:id/play` — Launch VLC
- `POST /api/movies/:id/open-folder` — Open in Explorer
- `GET /api/settings`
- `PATCH /api/settings`

## Environment Variables

- `OMDB_API_KEY` — OMDb API key (dev fallback; stored in DB settings for Electron)
- `PORT` — server port (set by workflow)
- `DB_PATH` — SQLite DB path (defaults to `monomax.db` in cwd; Electron sets to `%APPDATA%/Monomax/monomax.db`)
- `RENDERER_PATH` — Path to built frontend (Electron production only; serves SPA)

## Electron Build

Located in `artifacts/electron/`. The Electron main process:
1. Sets `PORT=19765`, `DB_PATH`, `NODE_ENV`, `RENDERER_PATH`
2. `require('./server')` — loads bundled Express server
3. Waits for healthz, then opens BrowserWindow loading `http://localhost:19765`

`node:sqlite` is built into Electron's Node runtime — zero native compilation needed.

**Build on Windows** (see `artifacts/electron/HOW_TO_BUILD.md`):
```powershell
pnpm install
cd artifacts\electron
pnpm run build:win    # → release/Monomax Setup 1.0.0.exe
```

> electron-builder Windows cross-compilation on Linux requires Wine (not available in Replit).
> Always build the installer on Windows.
