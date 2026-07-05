import { chunkDocument, type Chunk } from "../chunker.js";

export interface ChunkInput {
  docId: string;
  content: string;
  modelVersion: string;
}

export async function chunkActivity(input: ChunkInput): Promise<Chunk[]> {
  return chunkDocument(input);
}
