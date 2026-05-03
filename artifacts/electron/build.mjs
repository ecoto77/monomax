/**
 * Builds the Electron main process and server bundle using esbuild.
 *
 * Outputs:
 *   dist/main.js     — Electron main process (CJS)
 *   dist/server.js   — Bundled Express server (node:sqlite is a Node built-in)
 *   dist/preload.js  — Context-bridge preload script
 */

import { build } from "esbuild";
import path from "path";
import { fileURLToPath } from "url";
import { rm } from "fs/promises";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, "dist");

await rm(distDir, { recursive: true, force: true });

const sharedOptions = {
  bundle: true,
  platform: "node",
  format: "cjs",
  target: "node22",
  sourcemap: false,
  external: [
    "electron",
    // pino transports are loaded at runtime via worker threads
    "pino-pretty",
    "thread-stream",
    "pino/file",
    "pino-worker",
    // raw native addons (none expected, but just in case)
    "*.node",
  ],
};

// 1. Electron main process — keep require('./server') as a runtime call
await build({
  ...sharedOptions,
  entryPoints: [path.join(__dirname, "src/main.ts")],
  outfile: path.join(distDir, "main.js"),
  plugins: [
    {
      name: "external-server",
      setup(build) {
        build.onResolve({ filter: /^\.\/server$/ }, () => ({
          path: "./server",
          external: true,
        }));
      },
    },
  ],
});

// 2. Express server bundle — node:sqlite is a Node built-in, no extra externals
await build({
  ...sharedOptions,
  entryPoints: [path.join(__dirname, "src/server.ts")],
  outfile: path.join(distDir, "server.js"),
});

// 3. Preload script
await build({
  ...sharedOptions,
  entryPoints: [path.join(__dirname, "src/preload.ts")],
  outfile: path.join(distDir, "preload.js"),
});

console.log("✓ Electron build complete →", distDir);
