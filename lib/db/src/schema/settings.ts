import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";

export const settingsTable = sqliteTable("settings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  moviesDir: text("movies_dir").notNull().default("D:\\movies"),
  vlcPath: text("vlc_path").notNull().default("C:\\Program Files\\VideoLAN\\VLC\\vlc.exe"),
  omdbApiKey: text("omdb_api_key").notNull().default(""),
});

export type Settings = typeof settingsTable.$inferSelect;
