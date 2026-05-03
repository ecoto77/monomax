import express, { type Express } from "express";
import cors from "cors";
import path from "path";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

// When RENDERER_PATH is set (Electron production mode), serve the built frontend
const rendererPath = process.env["RENDERER_PATH"];
if (rendererPath) {
  app.use(express.static(rendererPath));
  // SPA fallback — return index.html for any route not handled above
  app.use((_req, res) => {
    res.sendFile(path.join(rendererPath, "index.html"));
  });
}

export default app;
