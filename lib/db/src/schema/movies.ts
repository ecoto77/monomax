import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const moviesTable = pgTable("movies", {
  id: serial("id").primaryKey(),
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
  folderName: text("folder_name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertMovieSchema = createInsertSchema(moviesTable).omit({ id: true, createdAt: true });
export type InsertMovie = z.infer<typeof insertMovieSchema>;
export type Movie = typeof moviesTable.$inferSelect;
