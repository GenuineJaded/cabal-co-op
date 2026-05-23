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
      lifeSeconds: 604800,
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
  const conditions = [eq(artifacts.isExpired, false)];
  if (type) conditions.push(eq(artifacts.type, type));
  return db
    .select()
    .from(artifacts)
    .where(and(...conditions))
    .orderBy(sql`${artifacts.purpleShade} DESC, ${artifacts.createdAt} DESC`);
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

// Record a view: extend life by 6 hours.
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
}

// Record a quip: extend life by 18 hours.
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
}

// ─── Decay ───────────────────────────────────────────────────────────────────

// Each shade = 18 hours (64800s) of inactivity. Capped at 7.
export function calculateShade(artifact: Artifact): number {
  const now = Date.now();
  const lastInteraction = artifact.lastInteractedAt.getTime();
  const inactiveSeconds = (now - lastInteraction) / 1000;
  return Math.min(7, Math.floor(inactiveSeconds / 64800));
}

export async function runDecay() {
  const db = getDb();
  if (!db) return { expired: 0, updated: 0 };

  // Find artifacts past their lifespan.
  const expired = await db
    .select({ id: artifacts.id, fileKey: artifacts.fileKey })
    .from(artifacts)
    .where(
      and(
        eq(artifacts.isExpired, false),
        sql`${artifacts.createdAt} + (${artifacts.lifeSeconds} * interval '1 second') < NOW()`
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

  // Update purple shades for surviving artifacts.
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
