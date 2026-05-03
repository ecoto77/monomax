# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Codegen Notes

Orval generates a `index.ts` that exports from `./generated/types` and `./generated/api.schemas` (which may not exist).
The codegen script in `lib/api-spec/package.json` creates a placeholder `api.schemas.ts` if missing.
Request body schema names in `openapi.yaml` must not match the TS type names orval generates — use `MovieLookupPayload`, `MovieUpdatePayload`, `MoviePlayPayload` (not `LookupMoviesBody` etc.) to avoid TS2308 ambiguity errors.

## Project: Cinemarchive — Movie Library App

A personal movie library that scans a local Windows folder (`D:\movies`), fetches metadata from OMDB/IMDB, and lets the user play movies in VLC.

### Artifacts

- `artifacts/movie-library` — React + Vite frontend (preview path `/`)
- `artifacts/api-server` — Express backend (preview path `/api`)

### Frontend Pages

- `/` — Library grid with search + filters (title, genre, director, actor, year, min rating, watched status)
- `/scan` — Scans `D:\movies`, looks up new folders on OMDB, shows results table
- `/stats` — Library stats: totals, watched count, avg rating, genre pie chart, top rated, recently added
- `/movies/:id` — Movie detail: poster, synopsis, IMDB rating, cast, director, watched toggle, personal star rating, notes, Play in VLC button, Open folder button

### Backend Routes

- `GET /api/movies` — List with filters: search, genre, director, actor, year, minRating, watched, sort
- `GET /api/movies/stats` — Library statistics
- `POST /api/movies/scan` — Scans `D:\movies`, fetches OMDB for new folders
- `GET /api/movies/:id` — Movie detail
- `DELETE /api/movies/:id` — Remove from library
- `PATCH /api/movies/:id/update` — Update watched, userRating, notes
- `GET /api/movies/:id/subtitles` — List .srt files in movie folder
- `POST /api/movies/:id/play` — Launch VLC with optional subtitle
- `POST /api/movies/:id/open-folder` — Open folder in Windows Explorer

### Database Schema (movies table)

id, title, year, imdbId, plot, imdbRating, genre, director, writer, actors, poster,
folderName (unique), folderPath, notFound (bool), watched (bool), userRating (int 1-5), notes, createdAt

### Environment Variables Required

- `OMDB_API_KEY` — secret, for OMDB API calls
- `MOVIES_DIR` — optional, defaults to `D:\movies`
- `VLC_PATH` — optional, defaults to `C:\Program Files\VideoLAN\VLC\vlc.exe`

### Future: Electron packaging

The app is structured to be packaged as a Windows .exe using Electron.
The Express backend + React frontend are kept separate and web-compatible for this purpose.

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
