import { nanoid } from "nanoid";
import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import {
  addIntimateMessage,
  createArtifact,
  createQuip,
  getArtifactById,
  getDbHealth,
  getIntimateMessages,
  getOrCreateThread,
  listArtifacts,
  listQuips,
  recordView,
  runDecay,
} from "./db";
import { storageConfigured, storagePut } from "./storage";

export const appRouter = router({
  system: router({
    health: publicProcedure.query(async () => {
      const db = await getDbHealth();
      return {
        ok: db.ok,
        db,
        storage: { configured: storageConfigured() },
      };
    }),
  }),

  artifact: router({
    list: publicProcedure
      .input(z.object({ type: z.enum(["writing", "music", "art"]).optional() }))
      .query(async ({ input }) => listArtifacts(input.type)),

    get: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => getArtifactById(input.id)),

    create: publicProcedure
      .input(
        z.object({
          nama: z.string().max(128).optional(),
          body: z.string().optional(),
          fileUrl: z.string().optional(),
          fileKey: z.string().optional(),
          type: z.enum(["writing", "music", "art"]).default("writing"),
        })
      )
      .mutation(async ({ input }) => createArtifact(input)),

    view: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await recordView(input.id);
        return { ok: true };
      }),

    uploadFile: publicProcedure
      .input(
        z.object({
          filename: z.string(),
          contentType: z.string(),
          base64: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        const buffer = Buffer.from(input.base64, "base64");
        const key = `artifacts/${nanoid()}-${input.filename}`;
        const { url } = await storagePut(key, buffer, input.contentType);
        return { url, key };
      }),
  }),

  quip: router({
    list: publicProcedure
      .input(z.object({ artifactId: z.number() }))
      .query(async ({ input }) => listQuips(input.artifactId)),

    create: publicProcedure
      .input(
        z.object({
          artifactId: z.number(),
          nama: z.string().max(128).optional(),
          body: z.string().optional(),
          fileUrl: z.string().optional(),
          fileKey: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => createQuip(input)),

    uploadFile: publicProcedure
      .input(
        z.object({
          filename: z.string(),
          contentType: z.string(),
          base64: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        const buffer = Buffer.from(input.base64, "base64");
        const key = `quips/${nanoid()}-${input.filename}`;
        const { url } = await storagePut(key, buffer, input.contentType);
        return { url, key };
      }),
  }),

  intimate: router({
    initiate: publicProcedure
      .input(z.object({ artifactId: z.number(), sessionId: z.string() }))
      .mutation(async ({ input }) =>
        getOrCreateThread(input.artifactId, input.sessionId)
      ),

    messages: publicProcedure
      .input(z.object({ threadId: z.number(), sessionId: z.string() }))
      .query(async ({ input }) => getIntimateMessages(input.threadId)),

    send: publicProcedure
      .input(
        z.object({
          threadId: z.number(),
          sessionId: z.string(),
          body: z.string().min(1).max(4000),
        })
      )
      .mutation(async ({ input }) => {
        await addIntimateMessage(input.threadId, input.sessionId, input.body);
        return { ok: true };
      }),
  }),

  decay: router({
    run: publicProcedure.mutation(async () => runDecay()),
  }),
});

export type AppRouter = typeof appRouter;
