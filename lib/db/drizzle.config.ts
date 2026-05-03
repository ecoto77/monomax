import { defineConfig } from "drizzle-kit";
import path from "path";

const dbPath = process.env["DB_PATH"] ?? path.join(process.cwd(), "monomax.db");

export default defineConfig({
  schema: path.join(__dirname, "./src/schema/index.ts"),
  dialect: "sqlite",
  dbCredentials: {
    url: dbPath.startsWith("file:") ? dbPath : `file:${dbPath}`,
  },
});
