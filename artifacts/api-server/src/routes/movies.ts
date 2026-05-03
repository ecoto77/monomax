import { Router, type IRouter } from "express";
import { eq, ilike, desc, asc, and, gte, sql } from "drizzle-orm";
import { db, moviesTable } from "@workspace/db";
import fs from "fs";
import path from "path";
import { spawn } from "child_process";
import {
  ListMoviesQueryParams,
  GetMovieParams,
  DeleteMovieParams,
  UpdateMovieParams,
  UpdateMovieBody,
  GetMovieSubtitlesParams,
  PlayMovieParams,
  PlayMovieBody,
  OpenMovieFolderParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

const MOVIES_DIR = process.env["MOVIES_DIR"] || "D:\\movies";
const VLC_PATH = process.env["VLC_PATH"] || "C:\\Program Files\\VideoLAN\\VLC\\vlc.exe";
const VIDEO_EXTENSIONS = [".mkv", ".mp4", ".avi", ".mov", ".wmv", ".m4v", ".ts", ".m2ts", ".flv", ".webm"];
const SUBTITLE_EXTENSIONS = [".srt", ".sub", ".ass", ".ssa", ".vtt"];

function parseMovieFolderName(folderName: string): { title: string; year?: string } {
  const yearMatch = folderName.match(/\((\d{4})\)/);
  const year = yearMatch ? yearMatch[1] : undefined;
  let title = folderName
    .replace(/\(\d{4}\).*$/, "")
    .replace(/\[.*?\]/g, "")
    .replace(/\{.*?\}/g, "")
    .trim();
  title = title.replace(/[._-]+/g, " ").trim();
  title = title.replace(/\s+/g, " ").trim();
  return { title, year };
}

function getLargestVideoFile(folderPath: string): string | null {
  try {
    const files = fs.readdirSync(folderPath);
    let largest: { file: string; size: number } | null = null;
    for (const file of files) {
      const ext = path.extname(file).toLowerCase();
      if (VIDEO_EXTENSIONS.includes(ext)) {
        const fullPath = path.join(folderPath, file);
        const stat = fs.statSync(fullPath);
        if (!largest || stat.size > largest.size) {
          largest = { file: fullPath, size: stat.size };
        }
      }
    }
    return largest ? largest.file : null;
  } catch {
    return null;
  }
}

function getSubtitleFiles(folderPath: string): Array<{ name: string; path: string }> {
  try {
    const files = fs.readdirSync(folderPath);
    return files
      .filter((f) => SUBTITLE_EXTENSIONS.includes(path.extname(f).toLowerCase()))
      .map((f) => ({ name: f, path: path.join(folderPath, f) }));
  } catch {
    return [];
  }
}

function toDto(m: typeof moviesTable.$inferSelect) {
  return { ...m, createdAt: m.createdAt.toISOString() };
}

// GET /movies
router.get("/movies", async (req, res) => {
  const params = ListMoviesQueryParams.parse(req.query);

  const conditions: ReturnType<typeof ilike>[] = [];
  if (params.search) conditions.push(ilike(moviesTable.title, `%${params.search}%`));
  if (params.genre) conditions.push(ilike(moviesTable.genre, `%${params.genre}%`));
  if (params.director) conditions.push(ilike(moviesTable.director, `%${params.director}%`));
  if (params.actor) conditions.push(ilike(moviesTable.actors, `%${params.actor}%`));
  if (params.year) conditions.push(ilike(moviesTable.year, `%${params.year}%`));
  if (params.watched === "true") conditions.push(eq(moviesTable.watched, true));
  if (params.watched === "false") conditions.push(eq(moviesTable.watched, false));

  let query = db.select().from(moviesTable).$dynamic();
  if (conditions.length === 1) query = query.where(conditions[0]);
  else if (conditions.length > 1) query = query.where(and(...conditions));

  if (params.minRating) {
    query = query.where(gte(sql`CAST(${moviesTable.imdbRating} AS DECIMAL)`, parseFloat(params.minRating)));
  }

  const sort = params.sort ?? "added";
  if (sort === "title") query = query.orderBy(asc(moviesTable.title));
  else if (sort === "year") query = query.orderBy(desc(moviesTable.year));
  else if (sort === "rating") query = query.orderBy(desc(moviesTable.imdbRating));
  else query = query.orderBy(desc(moviesTable.createdAt));

  const movies = await query;
  res.json(movies.map(toDto));
});

// GET /movies/stats
router.get("/movies/stats", async (_req, res) => {
  const allMovies = await db.select().from(moviesTable).orderBy(desc(moviesTable.createdAt));
  const total = allMovies.length;
  const watchedCount = allMovies.filter((m) => m.watched).length;
  const rated = allMovies.filter((m) => m.imdbRating && m.imdbRating !== "N/A");
  const avgRating =
    rated.length > 0
      ? rated.reduce((sum, m) => sum + parseFloat(m.imdbRating!), 0) / rated.length
      : 0;

  const genreMap: Record<string, number> = {};
  for (const movie of allMovies) {
    if (movie.genre) {
      for (const g of movie.genre.split(",")) {
        const genre = g.trim();
        if (genre) genreMap[genre] = (genreMap[genre] ?? 0) + 1;
      }
    }
  }
  const genreBreakdown = Object.entries(genreMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([genre, count]) => ({ genre, count }));

  const topRated = [...rated]
    .sort((a, b) => parseFloat(b.imdbRating!) - parseFloat(a.imdbRating!))
    .slice(0, 5)
    .map(toDto);

  const recentlyAdded = allMovies.slice(0, 5).map(toDto);

  res.json({ total, watched: watchedCount, avgRating: Math.round(avgRating * 10) / 10, genreBreakdown, topRated, recentlyAdded });
});

// POST /movies/scan
router.post("/movies/scan", async (req, res) => {
  const apiKey = process.env["OMDB_API_KEY"];
  if (!apiKey) {
    res.status(500).json({ error: "OMDB_API_KEY not configured" });
    return;
  }

  let folderNames: string[] = [];
  try {
    folderNames = fs.readdirSync(MOVIES_DIR).filter((f) => {
      try {
        return fs.statSync(path.join(MOVIES_DIR, f)).isDirectory();
      } catch {
        return false;
      }
    });
  } catch (err) {
    res.status(500).json({ error: `Cannot read movies directory: ${MOVIES_DIR}` });
    return;
  }

  const details: Array<{ folderName: string; title: string; status: string; reason?: string }> = [];
  let added = 0, skipped = 0, failed = 0, notFound = 0;

  for (const folderName of folderNames) {
    const folderPath = path.join(MOVIES_DIR, folderName);
    const { title, year } = parseMovieFolderName(folderName);

    const existing = await db
      .select()
      .from(moviesTable)
      .where(eq(moviesTable.folderName, folderName))
      .limit(1);

    if (existing.length > 0) {
      skipped++;
      details.push({ folderName, title, status: "skipped" });
      continue;
    }

    try {
      const url = new URL("https://www.omdbapi.com/");
      url.searchParams.set("apikey", apiKey);
      url.searchParams.set("t", title);
      if (year) url.searchParams.set("y", year);
      url.searchParams.set("plot", "short");

      const response = await fetch(url.toString());
      const data = await response.json() as Record<string, string>;

      let omdbData = data;
      if (data["Response"] === "False" && year) {
        const fallbackUrl = new URL("https://www.omdbapi.com/");
        fallbackUrl.searchParams.set("apikey", apiKey);
        fallbackUrl.searchParams.set("t", title);
        fallbackUrl.searchParams.set("plot", "short");
        const fallbackResp = await fetch(fallbackUrl.toString());
        omdbData = await fallbackResp.json() as Record<string, string>;
      }

      if (omdbData["Response"] === "False") {
        await db.insert(moviesTable).values({
          title,
          year: year ?? "Unknown",
          folderName,
          folderPath,
          notFound: true,
        });
        notFound++;
        details.push({ folderName, title, status: "not_found", reason: omdbData["Error"] ?? "Not found on IMDB" });
        continue;
      }

      const actorsList = omdbData["Actors"]
        ? omdbData["Actors"].split(",").slice(0, 5).join(",")
        : undefined;

      await db.insert(moviesTable).values({
        title: omdbData["Title"] ?? title,
        year: omdbData["Year"] ?? year ?? "Unknown",
        imdbId: omdbData["imdbID"],
        plot: omdbData["Plot"] !== "N/A" ? omdbData["Plot"] : undefined,
        imdbRating: omdbData["imdbRating"] !== "N/A" ? omdbData["imdbRating"] : undefined,
        genre: omdbData["Genre"] !== "N/A" ? omdbData["Genre"] : undefined,
        director: omdbData["Director"] !== "N/A" ? omdbData["Director"] : undefined,
        writer: omdbData["Writer"] !== "N/A" ? omdbData["Writer"] : undefined,
        actors: actorsList && actorsList !== "N/A" ? actorsList : undefined,
        poster: omdbData["Poster"] !== "N/A" ? omdbData["Poster"] : undefined,
        folderName,
        folderPath,
        notFound: false,
      });

      added++;
      details.push({ folderName, title: omdbData["Title"] ?? title, status: "added" });
    } catch {
      failed++;
      details.push({ folderName, title, status: "failed", reason: "Network error" });
    }
  }

  res.json({ added, skipped, failed, notFound, total: folderNames.length, details });
});

// GET /movies/:id
router.get("/movies/:id", async (req, res) => {
  const { id } = GetMovieParams.parse(req.params);
  const [movie] = await db.select().from(moviesTable).where(eq(moviesTable.id, id)).limit(1);
  if (!movie) { res.status(404).json({ error: "Movie not found" }); return; }
  res.json(toDto(movie));
});

// DELETE /movies/:id
router.delete("/movies/:id", async (req, res) => {
  const { id } = DeleteMovieParams.parse(req.params);
  const [deleted] = await db.delete(moviesTable).where(eq(moviesTable.id, id)).returning();
  if (!deleted) { res.status(404).json({ error: "Movie not found" }); return; }
  res.json({ success: true });
});

// PATCH /movies/:id/update
router.patch("/movies/:id/update", async (req, res) => {
  const { id } = UpdateMovieParams.parse(req.params);
  const body = UpdateMovieBody.parse(req.body);

  const updates: Partial<typeof moviesTable.$inferInsert> = {};
  if (body.watched !== undefined) updates.watched = body.watched;
  if (body.userRating !== undefined) updates.userRating = body.userRating;
  if (body.notes !== undefined) updates.notes = body.notes;

  const [updated] = await db.update(moviesTable).set(updates).where(eq(moviesTable.id, id)).returning();
  if (!updated) { res.status(404).json({ error: "Movie not found" }); return; }
  res.json(toDto(updated));
});

// GET /movies/:id/subtitles
router.get("/movies/:id/subtitles", async (req, res) => {
  const { id } = GetMovieSubtitlesParams.parse(req.params);
  const [movie] = await db.select().from(moviesTable).where(eq(moviesTable.id, id)).limit(1);
  if (!movie) { res.status(404).json({ error: "Movie not found" }); return; }
  const subs = getSubtitleFiles(movie.folderPath);
  res.json(subs);
});

// POST /movies/:id/play
router.post("/movies/:id/play", async (req, res) => {
  const { id } = PlayMovieParams.parse(req.params);
  const body = PlayMovieBody.parse(req.body ?? {});

  const [movie] = await db.select().from(moviesTable).where(eq(moviesTable.id, id)).limit(1);
  if (!movie) { res.status(404).json({ error: "Movie not found" }); return; }

  const videoFile = getLargestVideoFile(movie.folderPath);
  if (!videoFile) {
    res.status(404).json({ error: "No video file found in folder" });
    return;
  }

  const args = [videoFile];
  if (body.subtitlePath) {
    args.push("--sub-file", body.subtitlePath);
  }

  try {
    spawn(VLC_PATH, args, { detached: true, stdio: "ignore" }).unref();
    res.json({ success: true, message: `Launching VLC for: ${path.basename(videoFile)}` });
  } catch (err) {
    res.status(500).json({ success: false, message: `Failed to launch VLC: ${err}` });
  }
});

// POST /movies/:id/open-folder
router.post("/movies/:id/open-folder", async (req, res) => {
  const { id } = OpenMovieFolderParams.parse(req.params);
  const [movie] = await db.select().from(moviesTable).where(eq(moviesTable.id, id)).limit(1);
  if (!movie) { res.status(404).json({ error: "Movie not found" }); return; }

  try {
    spawn("explorer.exe", [movie.folderPath], { detached: true, stdio: "ignore" }).unref();
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Failed to open folder" });
  }
});

export default router;
