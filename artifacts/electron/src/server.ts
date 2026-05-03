// Express server entry — loaded by main.ts AFTER env vars are configured.

import expressApp from "../../api-server/src/app";

const port = Number(process.env["PORT"] ?? 19765);

expressApp.listen(port, (err?: Error) => {
  if (err) {
    process.stderr.write(`[monomax-server] Failed to start: ${err}\n`);
    process.exit(1);
  }
  process.stdout.write(`[monomax-server] Listening on port ${port}\n`);
});
