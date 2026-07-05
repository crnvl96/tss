import { db } from "../db/client.js";
import { chunks } from "../db/schema.js";
import type { Chunk } from "../chunker.js";

export async function storeActivity(input: {
  chunks: Chunk[];
  embeddings: number[][];
}): Promise<void> {
  const { chunks: chunkList, embeddings } = input;
  const rows = chunkList.map((chunk, i) => ({
    docId: chunk.docId,
    chunkIndex: chunk.chunkIndex,
    content: chunk.content,
    embedding: embeddings[i]!,
    modelVersion: chunk.modelVersion,
    contentHash: chunk.contentHash,
  }));

  // ON CONFLICT DO NOTHING — idempotent by content_hash
  await db.insert(chunks).values(rows).onConflictDoNothing({ target: chunks.contentHash });
}
