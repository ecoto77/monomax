// Preload script — minimal context bridge for future use
import { contextBridge } from "electron";

contextBridge.exposeInMainWorld("monomax", {
  version: process.env["npm_package_version"] ?? "1.0.0",
});
