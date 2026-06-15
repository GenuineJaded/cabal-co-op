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

// Shade model:
// - lifeSeconds is the artifact's remaining life *balance*, not its total lifespan.
// - A fresh artifact starts at BASE_LIFE_SECONDS (7 days) → shade 0 (white).
// - A view nominally adds 6h, a quip nominally adds 18h — but extension has
//   diminishing returns (see extendLife): the higher the balance already sits
//   above the base, the less of that nominal gain lands. Every SHADE_STEP_SECONDS
//   (24h) of balance beyond the base = one shade deeper into purple, capped at
//   MAX_SHADE.
// - The daily decay cron subtracts SHADE_STEP_SECONDS from every artifact's
//   balance. Untouched artifacts therefore drift back toward white and dissolve
//   when the balance hits 0.
const BASE_LIFE_SECONDS = 604800; // 7 days
const SHADE_STEP_SECONDS = 86400; // 24 hours
const MAX_SHADE = 12; // 13 shades total, 0 (white) through 12 (deepest purple)

// Nominal life gains, before diminishing returns are applied.
const VIEW_GAIN_SECONDS = 21600; // 6 hours
const QUIP_GAIN_SECONDS = 64800; // 18 hours

// The soft ceiling sits exactly at the deepest shade: 7-day base + 12 shade
// steps. Past it there is no further reward to bank — the colour can't deepen
// and the balance can't climb — so a concept has to keep earning support to
// hold the top instead of coasting on a stored surplus.
const SOFT_CEILING_SECONDS = BASE_LIFE_SECONDS + MAX_SHADE * SHADE_STEP_SECONDS; // 19 days
const EXTENSION_SPAN_SECONDS = SOFT_CEILING_SECONDS - BASE_LIFE_SECONDS; // 12 days

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
    sql`${artifacts.lifeSeconds} > 0`,
  ];
  if (type) conditions.push(eq(artifacts.type, type));
  // Sort by life balance: weightier (more interaction) artifacts surface first.
  return db
    .select()
    .from(artifacts)
    .where(and(...conditions))
    .orderBy(sql`${artifacts.lifeSeconds} DESC, ${artifacts.createdAt} DESC`);
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

// Record a view: extend life balance by a nominal 6 hours (diminished).
export async function recordView(artifactId: number) {
  const db = getDb();
  if (!db) return;
  await db.insert(interactions).values({ artifactId, type: "view" });
  await applyExtension(artifactId, VIEW_GAIN_SECONDS);
}

// Record a quip: extend life balance by a nominal 18 hours (diminished).
export async function recordQuipInteraction(artifactId: number) {
  const db = getDb();
  if (!db) return;
  await db.insert(interactions).values({ artifactId, type: "quip" });
  await applyExtension(artifactId, QUIP_GAIN_SECONDS);
}

// Apply a life extension with diminishing returns and persist the resulting
// balance and shade in a single write, so interaction reflects in color
// immediately rather than only after the next daily decay run.
async function applyExtension(artifactId: number, nominalGain: number) {
  const db = getDb();
  if (!db) return;
  const [row] = await db
    .select()
    .from(artifacts)
    .where(and(eq(artifacts.id, artifactId), eq(artifacts.isExpired, false)))
    .limit(1);
  if (!row) return;
  const lifeSeconds = extendLife(row.lifeSeconds, nominalGain);
  const purpleShade = calculateShade({ ...row, lifeSeconds });
  await db
    .update(artifacts)
    .set({ lifeSeconds, purpleShade, lastInteractedAt: new Date() })
    .where(eq(artifacts.id, artifactId));
}

// ─── Decay ───────────────────────────────────────────────────────────────────

// Shade derives from how much life has been *earned* beyond the base 7 days.
// 0 = white (fresh or unsupported); each 24h of extra balance = one shade deeper.
export function calculateShade(artifact: Artifact): number {
  const earnedExtra = artifact.lifeSeconds - BASE_LIFE_SECONDS;
  const shade = Math.floor(earnedExtra / SHADE_STEP_SECONDS);
  return Math.max(0, Math.min(MAX_SHADE, shade));
}

// Extend a life balance with diminishing returns. At or below the base, the
// full nominal gain lands; the further the balance already sits above the base,
// the smaller the fraction that lands, reaching zero at the soft ceiling. Paired
// with the flat daily decay, this means a concept can only hold a high position
// by *continuing* to draw support — it can't bank a surplus and coast.
export function extendLife(current: number, nominalGain: number): number {
  const surplus = Math.max(0, current - BASE_LIFE_SECONDS);
  const factor = Math.max(0, 1 - surplus / EXTENSION_SPAN_SECONDS);
  const applied = Math.floor(nominalGain * factor);
  return Math.min(SOFT_CEILING_SECONDS, current + applied);
}

export async function runDecay() {
  const db = getDb();
  if (!db) return { expired: 0, updated: 0 };

  // Daily fade: pull every artifact's life balance down by one shade-step.
  // Heavy interaction has to outpace this to climb in purple; quiet artifacts
  // drift back toward white and eventually cross zero.
  await db
    .update(artifacts)
    .set({ lifeSeconds: sql`${artifacts.lifeSeconds} - ${SHADE_STEP_SECONDS}` })
    .where(eq(artifacts.isExpired, false));

  // Dissolve anything whose balance ran out.
  const expired = await db
    .select({ id: artifacts.id, fileKey: artifacts.fileKey })
    .from(artifacts)
    .where(
      and(eq(artifacts.isExpired, false), sql`${artifacts.lifeSeconds} <= 0`)
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

  // Refresh purple shades for surviving artifacts.
  const active = await db
    .select()
    .from(artifacts)
    .where(eq(artifacts.isExpired, false));

  let updated = 0;
  for (const artifact of active) {
    const shade = calculateShade(artifact);
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
