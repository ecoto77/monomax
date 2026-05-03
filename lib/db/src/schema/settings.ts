import { pgTable, serial, text } from "drizzle-orm/pg-core";

export const settingsTable = pgTable("settings", {
  id: serial("id").primaryKey(),
  moviesDir: text("movies_dir").notNull().default("D:\\movies"),
  vlcPath: text("vlc_path").notNull().default("C:\\Program Files\\VideoLAN\\VLC\\vlc.exe"),
});

export type Settings = typeof settingsTable.$inferSelect;
