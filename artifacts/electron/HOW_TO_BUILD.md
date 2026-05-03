# How to Build the Windows Installer

## Prerequisites (on your Windows machine)

1. **Node.js 22+** — https://nodejs.org  
   (check: `node -v` should show v22.x or higher)

2. **pnpm** — `npm install -g pnpm`

3. **Git** (to clone/pull the project)

> No Python, no Visual Studio Build Tools, no native compilation needed.  
> The app uses Node's built-in SQLite (`node:sqlite`) — no `better-sqlite3` required.

---

## Build Steps

Open a terminal (PowerShell or CMD) in the **project root** (where `pnpm-workspace.yaml` lives):

```powershell
# 1. Install all workspace dependencies
pnpm install

# 2. Move into the electron package
cd artifacts\electron

# 3. Build everything and create the installer
pnpm run build:win
```

This will:
- Build the React frontend with `BASE_PATH=/`
- Bundle the Express API server with esbuild (node:sqlite is Electron's built-in)
- Compile the Electron main process
- Package everything into `artifacts/electron/release/` as a Windows NSIS installer

---

## Output

```
artifacts/electron/release/
  Monomax Setup 1.0.0.exe   ← run this on your Windows PC
```

Double-click the installer, follow the wizard, then launch **Monomax** from the Desktop or Start Menu.

---

## First Run

On first launch the app will:
1. Create a SQLite database at `%APPDATA%\Monomax\monomax.db`
2. Open with your library empty

Go to **Settings** and confirm your:
- **Movies folder** — e.g. `D:\movies`
- **VLC path** — e.g. `C:\Program Files\VideoLAN\VLC\vlc.exe`

Then click **Scan Library** to import your movies.

---

## Portable Build (no installer)

```powershell
pnpm run build:win:portable
```

Creates `release/win-unpacked/Monomax.exe` — copy the entire folder anywhere and run it directly.

---

## Optional: Custom Icon

Place a 256×256 PNG at `artifacts/electron/build/icon.png` before building.  
electron-builder will automatically convert it to `.ico` for Windows.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `OMDB_API_KEY not configured` on Scan | The API key is bundled at build time. Ensure `OMDB_API_KEY` is set in your environment before building, or set it as a Windows environment variable and restart the app. |
| VLC won't launch | Check the VLC path in Settings — default is `C:\Program Files\VideoLAN\VLC\vlc.exe`. |
| Movies scan finds no folders | Make sure your movies folder contains sub-folders, one per movie (e.g. `D:\movies\The Dark Knight (2008)\`). |
| `node:sqlite` experimental warning | Harmless — SQLite is stable in Node 22+ even though the warning shows "experimental". |
