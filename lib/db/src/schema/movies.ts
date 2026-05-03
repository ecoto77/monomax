import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const moviesTable = sqliteTable("movies", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  year: text("year").notNull(),
  imdbId: text("imdb_id"),
  plot: text("plot"),
  imdbRating: text("imdb_rating"),
  genre: text("genre"),
  director: text("director"),
  writer: text("writer"),
  actors: text("actors"),
  poster: text("poster"),
  folderName: text("folder_name").notNull().unique(),
  folderPath: text("folder_path").notNull(),
  notFound: integer("not_found", { mode: "boolean" }).default(false).notNull(),
  watched: integer("watched", { mode: "boolean" }).default(false).notNull(),
  userRating: integer("user_rating"),
  notes: text("notes"),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const insertMovieSchema = createInsertSchema(moviesTable).omit({ id: true, createdAt: true });
export type InsertMovie = z.infer<typeof insertMovieSchema>;
export type Movie = typeof moviesTable.$inferSelect;
