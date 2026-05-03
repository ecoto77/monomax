import { Router, type IRouter } from "express";
import { eq, ilike, desc, asc } from "drizzle-orm";
import { db, moviesTable } from "@workspace/db";
import {
  ListMoviesQueryParams,
  ParseMovieFoldersBody,
  LookupMoviesBody,
  GetMovieParams,
  DeleteMovieParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

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

router.get("/movies", async (req, res) => {
  const params = ListMoviesQueryParams.parse(req.query);
  let query = db.select().from(moviesTable).$dynamic();

  if (params.search) {
    query = query.where(ilike(moviesTable.title, `%${params.search}%`));
  }

  if (params.genre) {
    query = query.where(ilike(moviesTable.genre, `%${params.genre}%`));
  }

  const sort = params.sort ?? "added";
  if (sort === "title") {
    query = query.orderBy(asc(moviesTable.title));
  } else if (sort === "year") {
    query = query.orderBy(desc(moviesTable.year));
  } else if (sort === "rating") {
    query = query.orderBy(desc(moviesTable.imdbRating));
  } else {
    query = query.orderBy(desc(moviesTable.createdAt));
  }

  const movies = await query;
  res.json(movies.map((m) => ({ ...m, createdAt: m.createdAt.toISOString() })));
});

router.get("/movies/stats", async (_req, res) => {
  const allMovies = await db.select().from(moviesTable).orderBy(desc(moviesTable.createdAt));

  const total = allMovies.length;

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
    .map((m) => ({ ...m, createdAt: m.createdAt.toISOString() }));

  const recentlyAdded = allMovies
    .slice(0, 5)
    .map((m) => ({ ...m, createdAt: m.createdAt.toISOString() }));

  res.json({ total, avgRating: Math.round(avgRating * 10) / 10, genreBreakdown, topRated, recentlyAdded });
});

router.post("/movies/parse", async (req, res) => {
  const { folders } = ParseMovieFoldersBody.parse(req.body);
  const parsed = folders
    .map((f) => f.trim())
    .filter(Boolean)
    .map((folderName) => {
      const { title, year } = parseMovieFolderName(folderName);
      return { title, year, folderName };
    });
  res.json(parsed);
});

router.post("/movies/lookup", async (req, res) => {
  const { movies } = LookupMoviesBody.parse(req.body);

  const apiKey = process.env["OMDB_API_KEY"];
  if (!apiKey) {
    res.status(500).json({ error: "OMDB_API_KEY not configured" });
    return;
  }

  const saved: object[] = [];
  const failed: object[] = [];

  for (const movie of movies) {
    try {
      const existing = await db
        .select()
        .from(moviesTable)
        .where(eq(moviesTable.folderName, movie.folderName))
        .limit(1);

      if (existing.length > 0) {
        saved.push({ ...existing[0], createdAt: existing[0].createdAt.toISOString() });
        continue;
      }

      const url = new URL("https://www.omdbapi.com/");
      url.searchParams.set("apikey", apiKey);
      url.searchParams.set("t", movie.title);
      if (movie.year) url.searchParams.set("y", movie.year);
      url.searchParams.set("plot", "short");

      const response = await fetch(url.toString());
      const data = await response.json() as Record<string, string>;

      if (data["Response"] === "False") {
        const urlFallback = new URL("https://www.omdbapi.com/");
        urlFallback.searchParams.set("apikey", apiKey);
        urlFallback.searchParams.set("t", movie.title);
        urlFallback.searchParams.set("plot", "short");
        const fallbackResp = await fetch(urlFallback.toString());
        const fallbackData = await fallbackResp.json() as Record<string, string>;

        if (fallbackData["Response"] === "False") {
          failed.push({ title: movie.title, year: movie.year, folderName: movie.folderName, reason: fallbackData["Error"] ?? "Not found" });
          continue;
        }
        Object.assign(data, fallbackData);
      }

      const actorsList = data["Actors"]
        ? data["Actors"].split(",").slice(0, 5).join(",")
        : undefined;

      const [inserted] = await db
        .insert(moviesTable)
        .values({
          title: data["Title"] ?? movie.title,
          year: data["Year"] ?? movie.year ?? "Unknown",
          imdbId: data["imdbID"],
          plot: data["Plot"] !== "N/A" ? data["Plot"] : undefined,
          imdbRating: data["imdbRating"] !== "N/A" ? data["imdbRating"] : undefined,
          genre: data["Genre"] !== "N/A" ? data["Genre"] : undefined,
          director: data["Director"] !== "N/A" ? data["Director"] : undefined,
          writer: data["Writer"] !== "N/A" ? data["Writer"] : undefined,
          actors: actorsList !== "N/A" ? actorsList : undefined,
          poster: data["Poster"] !== "N/A" ? data["Poster"] : undefined,
          folderName: movie.folderName,
        })
        .returning();

      saved.push({ ...inserted, createdAt: inserted.createdAt.toISOString() });
    } catch (err) {
      failed.push({ title: movie.title, year: movie.year, folderName: movie.folderName, reason: "Network error" });
    }
  }

  res.json({ saved, failed });
});

router.get("/movies/:id", async (req, res) => {
  const { id } = GetMovieParams.parse(req.params);
  const [movie] = await db.select().from(moviesTable).where(eq(moviesTable.id, id)).limit(1);
  if (!movie) {
    res.status(404).json({ error: "Movie not found" });
    return;
  }
  res.json({ ...movie, createdAt: movie.createdAt.toISOString() });
});

router.delete("/movies/:id", async (req, res) => {
  const { id } = DeleteMovieParams.parse(req.params);
  const [deleted] = await db.delete(moviesTable).where(eq(moviesTable.id, id)).returning();
  if (!deleted) {
    res.status(404).json({ error: "Movie not found" });
    return;
  }
  res.json({ success: true });
});

export default router;
