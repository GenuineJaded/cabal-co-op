import { and, eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import {
  Artifact,
  InsertArtifact,
  artifacts,
  interactions,
  intimateMessages,
  intimateThreads,
  quips,
} from "../drizzle/schema.js";
import { storageDelete } from "./storage.js";

// Shade + decay model (time-based, self-healing):
// - lifeSeconds is the artifact's *total granted lifespan*, measured from
//   createdAt. A fresh artifact starts at BASE_LIFE_SECONDS (7 days).
// - A view adds 6h, a quip adds 18h — they push the deadline
//   (createdAt + lifeSeconds) further out.
// - The artifact dissolves once that deadline passes. Decay is the passage of
//   wall-clock time, not a stored countdown the cron decrements. That makes the
//   cron idempotent: running it twice in a day, or once after a week of missed
//   runs, both leave the field in exactly the right state. A missed cron can no
//   longer leave a post immortal — it just dissolves on the next run after its
//   deadline.
// - Shade reflects life remaining *beyond* the base 7 days: each
//   SHADE_STEP_SECONDS (24h) of extra remaining life = one shade deeper into
//   purple (capped at MAX_SHADE). Interaction deepens the shade; the passage of
//   time fades it back toward white.
const BASE_LIFE_SECONDS = 604800; // 7 days
const SHADE_STEP_SECONDS = 86400; // 24 hours
const MAX_SHADE = 12; // 13 shades total, 0 (white) through 12 (deepest purple)

let _db: ReturnType<typeof drizzle> | null = null;

export function getDb() {
  if (_db) return _db;
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  try {
    const client = postgres(url, { prepare: false });
    _db = drizzle(client);
    return _db;
  } catch (error) {
    console.warn("[db] connect failed:", error);
    return null;
  }
}

export async function getDbHealth() {
  if (!process.env.DATABASE_URL) {
    return { ok: false as const, reason: "DATABASE_URL missing" as const };
  }
  const db = getDb();
  if (!db) return { ok: false as const, reason: "client unavailable" as const };
  try {
    await db.execute(sql`SELECT 1`);
    return { ok: true as const };
  } catch (error) {
    return {
      ok: false as const,
      reason: error instanceof Error ? error.message : String(error),
    };
  }
}

// ─── Artifacts ───────────────────────────────────────────────────────────────

export async function createArtifact(data: InsertArtifact) {
  const db = getDb();
  if (!db) throw new Error("DB unavailable");
  const [result] = await db
    .insert(artifacts)
    .values({
      ...data,
      lifeSeconds: BASE_LIFE_SECONDS,
      purpleShade: 0,
      isExpired: false,
      lastInteractedAt: new Date(),
    })
    .returning();
  return result;
}

export async function listArtifacts(type?: "writing" | "music" | "art") {
  const db = getDb();
  if (!db) return [];
  const conditions = [
    eq(artifacts.isExpired, false),
    // Alive while the deadline (createdAt + lifeSeconds) is still in the future.
    sql`${artifacts.createdAt} + (${artifacts.lifeSeconds} * interval '1 second') > now()`,
  ];
  if (type) conditions.push(eq(artifacts.type, type));
  // Sort by deadline: weightier (more interaction) artifacts last longer and so
  // surface first.
  return db
    .select()
    .from(artifacts)
    .where(and(...conditions))
    .orderBy(
      sql`(${artifacts.createdAt} + (${artifacts.lifeSeconds} * interval '1 second')) DESC`
    );
}

export async function getArtifactById(id: number) {
  const db = getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(artifacts)
    .where(eq(artifacts.id, id))
    .limit(1);
  return result[0];
}

// Record a view: extend life balance by 6 hours, refresh shade.
export async function recordView(artifactId: number) {
  const db = getDb();
  if (!db) return;
  await db.insert(interactions).values({ artifactId, type: "view" });
  await db
    .update(artifacts)
    .set({
      lifeSeconds: sql`${artifacts.lifeSeconds} + 21600`,
      lastInteractedAt: new Date(),
    })
    .where(and(eq(artifacts.id, artifactId), eq(artifacts.isExpired, false)));
  await refreshShade(artifactId);
}

// Record a quip: extend life balance by 18 hours, refresh shade.
export async function recordQuipInteraction(artifactId: number) {
  const db = getDb();
  if (!db) return;
  await db.insert(interactions).values({ artifactId, type: "quip" });
  await db
    .update(artifacts)
    .set({
      lifeSeconds: sql`${artifacts.lifeSeconds} + 64800`,
      lastInteractedAt: new Date(),
    })
    .where(and(eq(artifacts.id, artifactId), eq(artifacts.isExpired, false)));
  await refreshShade(artifactId);
}

// Recompute and persist purpleShade for a single artifact so interaction
// reflects in color immediately, not only after the next daily decay run.
async function refreshShade(artifactId: number) {
  const db = getDb();
  if (!db) return;
  const [row] = await db
    .select()
    .from(artifacts)
    .where(eq(artifacts.id, artifactId))
    .limit(1);
  if (!row) return;
  const shade = calculateShade(row);
  if (shade !== row.purpleShade) {
    await db
      .update(artifacts)
      .set({ purpleShade: shade })
      .where(eq(artifacts.id, artifactId));
  }
}

// ─── Decay ───────────────────────────────────────────────────────────────────

// Shade derives from how much life remains *beyond* the base 7 days. Remaining
// life is the deadline (createdAt + lifeSeconds) minus now: interaction pushes
// the deadline out and deepens the shade, while the passage of time pulls it
// back toward white. 0 = white (fresh, unsupported, or fading); each 24h of
// extra remaining life = one shade deeper, capped at MAX_SHADE.
export function calculateShade(
  artifact: Artifact,
  now: Date = new Date()
): number {
  const deadlineSeconds =
    artifact.createdAt.getTime() / 1000 + artifact.lifeSeconds;
  const remaining = deadlineSeconds - now.getTime() / 1000;
  const earnedExtra = remaining - BASE_LIFE_SECONDS;
  const shade = Math.floor(earnedExtra / SHADE_STEP_SECONDS);
  return Math.max(0, Math.min(MAX_SHADE, shade));
}

export async function runDecay() {
  const db = getDb();
  if (!db) return { expired: 0, updated: 0 };

  // Dissolve anything whose deadline (createdAt + lifeSeconds) has passed.
  // This is time-based, so it is correct no matter how often the cron fires:
  // a missed run just means a post dissolves on the next run after its deadline,
  // never that it lives forever.
  const expired = await db
    .select({ id: artifacts.id, fileKey: artifacts.fileKey })
    .from(artifacts)
    .where(
      and(
        eq(artifacts.isExpired, false),
        sql`${artifacts.createdAt} + (${artifacts.lifeSeconds} * interval '1 second') <= now()`
      )
    );

  let expiredCount = 0;
  const filesToDelete: string[] = [];

  for (const a of expired) {
    // Gather quip files for compost too.
    const quipFiles = await db
      .select({ fileKey: quips.fileKey })
      .from(quips)
      .where(eq(quips.artifactId, a.id));
    for (const q of quipFiles) {
      if (q.fileKey) filesToDelete.push(q.fileKey);
    }
    if (a.fileKey) filesToDelete.push(a.fileKey);

    await db.delete(interactions).where(eq(interactions.artifactId, a.id));
    await db.delete(quips).where(eq(quips.artifactId, a.id));
    await db
      .delete(intimateMessages)
      .where(
        sql`${intimateMessages.threadId} IN (
          SELECT id FROM intimate_threads WHERE "artifactId" = ${a.id}
        )`
      );
    await db.delete(intimateThreads).where(eq(intimateThreads.artifactId, a.id));
    await db.delete(artifacts).where(eq(artifacts.id, a.id));
    expiredCount++;
  }

  // Quietly clean files. If storage isn't configured, this is a no-op.
  await storageDelete(filesToDelete);

  // Refresh purple shades for surviving artifacts against the current moment.
  const now = new Date();
  const active = await db
    .select()
    .from(artifacts)
    .where(eq(artifacts.isExpired, false));

  let updated = 0;
  for (const artifact of active) {
    const shade = calculateShade(artifact, now);
    if (shade !== artifact.purpleShade) {
      await db
        .update(artifacts)
        .set({ purpleShade: shade })
        .where(eq(artifacts.id, artifact.id));
      updated++;
    }
  }

  return { expired: expiredCount, updated };
}

// ─── Quips ───────────────────────────────────────────────────────────────────

export async function createQuip(data: {
  artifactId: number;
  nama?: string;
  body?: string;
  fileUrl?: string;
  fileKey?: string;
}) {
  const db = getDb();
  if (!db) throw new Error("DB unavailable");
  const [result] = await db.insert(quips).values(data).returning();
  await recordQuipInteraction(data.artifactId);
  return result;
}

export async function listQuips(artifactId: number) {
  const db = getDb();
  if (!db) return [];
  return db
    .select()
    .from(quips)
    .where(eq(quips.artifactId, artifactId))
    .orderBy(quips.createdAt);
}

// ─── Intimate Collaborate ────────────────────────────────────────────────────

export async function getOrCreateThread(artifactId: number, sessionId: string) {
  const db = getDb();
  if (!db) throw new Error("DB unavailable");

  const existing = await db
    .select()
    .from(intimateThreads)
    .where(
      and(
        eq(intimateThreads.artifactId, artifactId),
        sql`(${intimateThreads.sessionA} = ${sessionId} OR ${intimateThreads.sessionB} = ${sessionId})`
      )
    )
    .limit(1);
  if (existing.length > 0) return existing[0];

  const open = await db
    .select()
    .from(intimateThreads)
    .where(
      and(
        eq(intimateThreads.artifactId, artifactId),
        sql`${intimateThreads.sessionB} IS NULL`
      )
    )
    .limit(1);
  if (open.length > 0) {
    await db
      .update(intimateThreads)
      .set({ sessionB: sessionId })
      .where(eq(intimateThreads.id, open[0].id));
    return { ...open[0], sessionB: sessionId };
  }

  const [created] = await db
    .insert(intimateThreads)
    .values({ artifactId, sessionA: sessionId })
    .returning();
  return created;
}

export async function addIntimateMessage(
  threadId: number,
  sessionId: string,
  body: string
) {
  const db = getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(intimateMessages).values({ threadId, sessionId, body });
}

export async function getIntimateMessages(threadId: number) {
  const db = getDb();
  if (!db) return [];
  return db
    .select()
    .from(intimateMessages)
    .where(eq(intimateMessages.threadId, threadId))
    .orderBy(intimateMessages.createdAt);
}
