// Uses Node.js 22+ built-in `node:sqlite` — zero external package dependencies.
// drizzle-orm/sqlite-proxy is pure JS. mapResultRow expects positional value
// arrays, so we convert node:sqlite object rows via Object.values().

import { DatabaseSync } from "node:sqlite";
import { drizzle } from "drizzle-orm/sqlite-proxy";
import * as schema from "./schema";
import path from "path";
import fs from "fs";

const dbPath =
  process.env["DB_PATH"] ?? path.join(process.cwd(), "monomax.db");

const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const sqlite = new DatabaseSync(dbPath);

// Auto-create tables on first run
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS movies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    year TEXT NOT NULL,
    imdb_id TEXT,
    plot TEXT,
    imdb_rating TEXT,
    genre TEXT,
    director TEXT,
    writer TEXT,
    actors TEXT,
    poster TEXT,
    folder_name TEXT NOT NULL UNIQUE,
    folder_path TEXT NOT NULL,
    not_found INTEGER NOT NULL DEFAULT 0,
    watched INTEGER NOT NULL DEFAULT 0,
    user_rating INTEGER,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
  );
  CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    movies_dir TEXT NOT NULL DEFAULT 'D:\movies',
    vlc_path TEXT NOT NULL DEFAULT 'C:\Program Files\VideoLAN\VLC\vlc.exe',
    omdb_api_key TEXT NOT NULL DEFAULT ''
  );
`);

// Idempotent column migrations — ADD COLUMN is a no-op if already present
// (SQLite throws on duplicate columns; we silence that error)
for (const ddl of [
  `ALTER TABLE settings ADD COLUMN omdb_api_key TEXT NOT NULL DEFAULT ''`,
]) {
  try {
    sqlite.exec(ddl);
  } catch {
    // Column already exists — safe to ignore
  }
}

type Row = Record<string, unknown>;

// drizzle's mapResultRow expects POSITIONAL value arrays (row[0], row[1]…)
// node:sqlite returns objects, so we convert with Object.values() which
// preserves the SQL column order as returned by the SELECT clause.
export const db = drizzle(
  async (
    sql: string,
    params: unknown[],
    method: "run" | "all" | "get" | "values",
  ) => {
    const stmt = sqlite.prepare(sql);

    if (method === "run") {
      stmt.run(...params);
      return { rows: [] as unknown[] };
    }

    if (method === "get") {
      const row = stmt.get(...params) as Row | undefined;
      // mapGetResult treats clientResult.rows as the single row value array.
      // Return undefined (falsy) so mapGetResult returns void 0 when no row.
      return { rows: row ? (Object.values(row) as unknown[]) : undefined };
    }

    // "all" and "values" — return array of positional value arrays
    const rows = stmt.all(...params) as Row[];
    return { rows: rows.map((r) => Object.values(r)) as unknown[] };
  },
  { schema },
);

export * from "./schema";
