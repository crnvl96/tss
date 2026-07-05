import { embed } from "../embedder.js";

export async function embedActivity(texts: string[]): Promise<number[][]> {
  return embed(texts);
}
