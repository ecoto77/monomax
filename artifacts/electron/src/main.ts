import { app, BrowserWindow } from "electron";
import path from "path";
import http from "http";

const PORT = 19765;

function waitForServer(): Promise<void> {
  return new Promise((resolve) => {
    const check = () => {
      const req = http.get(`http://localhost:${PORT}/api/healthz`, (res) => {
        if (res.statusCode === 200) {
          resolve();
        } else {
          setTimeout(check, 400);
        }
      });
      req.on("error", () => setTimeout(check, 400));
      req.setTimeout(800, () => {
        req.destroy();
        setTimeout(check, 400);
      });
    };
    setTimeout(check, 600);
  });
}

function createWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 960,
    minHeight: 640,
    backgroundColor: "#1e2535",
    title: "Monomax – Home Cinema",
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.loadURL(`http://localhost:${PORT}`);
  return win;
}

app.whenReady().then(async () => {
  const userData = app.getPath("userData");

  // Set env vars BEFORE loading the server bundle
  process.env["PORT"] = String(PORT);
  process.env["DB_PATH"] = path.join(userData, "monomax.db");
  process.env["NODE_ENV"] = "production";

  if (app.isPackaged) {
    process.env["RENDERER_PATH"] = path.join(process.resourcesPath, "renderer");
  } else {
    // Dev mode: point at the workspace build outputs
    process.env["RENDERER_PATH"] = path.resolve(
      __dirname,
      "../../../movie-library/dist/public",
    );
  }

  // Load server AFTER env vars are set (inline require stays in-place in CJS)
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require("./server");

  await waitForServer();

  const win = createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

  // Open DevTools only in dev mode
  if (!app.isPackaged) {
    win.webContents.openDevTools({ mode: "detach" });
  }
});

app.on("window-all-closed", () => {
  app.quit();
});
