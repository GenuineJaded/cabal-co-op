import {
  bigint,
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const typeEnum = pgEnum("type", ["writing", "music", "art"]);
export const interactionTypeEnum = pgEnum("interaction_type", ["view", "quip"]);

// Artifacts — the core presences in the field.
export const artifacts = pgTable(
  "artifacts",
  {
    id: serial("id").primaryKey(),
    nama: varchar("nama", { length: 128 }),
    body: text("body"),
    fileUrl: text("fileUrl"),
    fileKey: varchar("fileKey", { length: 256 }),
    type: typeEnum("type").notNull().default("writing"),
    // base 7 days = 604800 seconds, extended by interactions
    lifeSeconds: bigint("lifeSeconds", { mode: "number" }).notNull().default(604800),
    // 0 = white (new), 1-7 = deepening purple
    purpleShade: integer("purpleShade").notNull().default(0),
    isExpired: boolean("isExpired").notNull().default(false),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    lastInteractedAt: timestamp("lastInteractedAt").defaultNow().notNull(),
  },
  (t) => ({
    typeActive: index("idx_artifacts_type_active").on(t.type, t.isExpired),
  })
);

export type Artifact = typeof artifacts.$inferSelect;
export type InsertArtifact = typeof artifacts.$inferInsert;

// Quips — responses to artifacts.
export const quips = pgTable(
  "quips",
  {
    id: serial("id").primaryKey(),
    artifactId: integer("artifactId").notNull(),
    nama: varchar("nama", { length: 128 }),
    body: text("body"),
    fileUrl: text("fileUrl"),
    fileKey: varchar("fileKey", { length: 256 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (t) => ({
    byArtifact: index("idx_quips_artifact").on(t.artifactId),
  })
);

export type Quip = typeof quips.$inferSelect;
export type InsertQuip = typeof quips.$inferInsert;

// Interactions — views and quips, used to extend artifact life.
export const interactions = pgTable(
  "interactions",
  {
    id: serial("id").primaryKey(),
    artifactId: integer("artifactId").notNull(),
    type: interactionTypeEnum("type").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (t) => ({
    byArtifact: index("idx_interactions_artifact").on(t.artifactId),
  })
);

export type Interaction = typeof interactions.$inferSelect;

// Intimate Collaborate — ephemeral DM threads scoped to artifact + two sessions.
export const intimateThreads = pgTable(
  "intimate_threads",
  {
    id: serial("id").primaryKey(),
    artifactId: integer("artifactId").notNull(),
    sessionA: varchar("sessionA", { length: 128 }).notNull(),
    sessionB: varchar("sessionB", { length: 128 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (t) => ({
    byArtifact: index("idx_intimate_threads_artifact").on(t.artifactId),
  })
);

export const intimateMessages = pgTable(
  "intimate_messages",
  {
    id: serial("id").primaryKey(),
    threadId: integer("threadId").notNull(),
    sessionId: varchar("sessionId", { length: 128 }).notNull(),
    body: text("body").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (t) => ({
    byThread: index("idx_intimate_messages_thread").on(t.threadId),
  })
);

export type IntimateThread = typeof intimateThreads.$inferSelect;
export type IntimateMessage = typeof intimateMessages.$inferSelect;
