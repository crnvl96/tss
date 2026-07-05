import {
  bigserial,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  vector,
} from "drizzle-orm/pg-core";

export const chunks = pgTable(
  "chunks",
  {
    id: bigserial({ mode: "number" }).primaryKey(),
    docId: text("doc_id").notNull(),
    chunkIndex: integer("chunk_index").notNull(),
    content: text().notNull(),
    embedding: vector({ dimensions: 384 }).notNull(),
    modelVersion: text("model_version").notNull(),
    contentHash: text("content_hash").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex("chunks_content_hash_uq").on(t.contentHash)],
);
