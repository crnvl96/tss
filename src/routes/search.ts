import { zValidator } from "@hono/zod-validator";
import { cosineDistance } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { db } from "../db/client.js";
import { chunks } from "../db/schema.js";
import { embed } from "../embedder.js";

// ----- schema ------------------------------------------------------
const searchSchema = z.object({
  query: z.string().min(1),
  topK: z.number().int().min(1).max(100).default(10),
});

// ----- route -------------------------------------------------------
export const searchRoute = new Hono().post("/", zValidator("json", searchSchema), async (c) => {
  const { query, topK } = c.req.valid("json");
  const embedding = await embed(query);

  const rows = await db
    .select({
      docId: chunks.docId,
      chunkIndex: chunks.chunkIndex,
      content: chunks.content,
      score: cosineDistance(chunks.embedding, embedding),
    })
    .from(chunks)
    .orderBy(cosineDistance(chunks.embedding, embedding))
    .limit(topK);

  return c.json(rows);
});
