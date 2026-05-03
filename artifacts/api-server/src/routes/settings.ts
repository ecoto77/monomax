import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, settingsTable } from "@workspace/db";

const router: IRouter = Router();

export async function getOrCreateSettings() {
  const rows = await db.select().from(settingsTable).limit(1);
  if (rows.length > 0) return rows[0]!;
  const [created] = await db.insert(settingsTable).values({}).returning();
  return created!;
}

// GET /settings
router.get("/settings", async (_req, res) => {
  const settings = await getOrCreateSettings();
  res.json(settings);
});

// PATCH /settings
router.patch("/settings", async (req, res) => {
  const body = req.body as { moviesDir?: string; vlcPath?: string; omdbApiKey?: string };
  const current = await getOrCreateSettings();

  const updates: Partial<typeof settingsTable.$inferInsert> = {};
  if (typeof body.moviesDir === "string") updates.moviesDir = body.moviesDir;
  if (typeof body.vlcPath === "string") updates.vlcPath = body.vlcPath;
  if (typeof body.omdbApiKey === "string") updates.omdbApiKey = body.omdbApiKey;

  const [updated] = await db
    .update(settingsTable)
    .set(updates)
    .where(eq(settingsTable.id, current.id))
    .returning();

  res.json(updated ?? current);
});

export default router;
