import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { chunkDocument } from "../src/chunker.js";
import { db } from "../src/db/client.js";
import { chunks } from "../src/db/schema.js";
import { embed, modelVersion } from "../src/embedder.js";
import { app } from "../src/server.js";

// ----- seed documents ----------------------------------------------
const DOG_DOC = {
  docId: "seed/dogs",
  content: [
    "Dogs (Canis familiaris) are domesticated mammals and the most widely kept working and companion animals in human history. Modern dog breeds show more variation in size, appearance, and behavior than any other domestic animal.",
    "Training a dog requires positive reinforcement techniques. Clicker training, treat rewards, and consistent commands help build reliable behaviors. Puppies learn fastest between 8 and 16 weeks of age.",
    "Common dog breeds include Labrador Retrievers, German Shepherds, Golden Retrievers, and French Bulldogs. Each breed has distinct exercise needs, grooming requirements, and temperament traits.",
  ].join(" "),
};

const CAT_DOC = {
  docId: "seed/cats",
  content: [
    "Cats (Felis catus) are small carnivorous mammals that are often kept as indoor pets. They are the second most popular pet in the world after dogs, with an estimated 600 million cats living with humans.",
    "Cat behavior includes purring, kneading, and scratching. Unlike dogs, cats are solitary hunters and do not have a pack hierarchy. They communicate through meowing, body language, and scent marking.",
    "Popular cat breeds include Siamese, Persian, Maine Coon, and British Shorthair. Cats groom themselves and require less hands-on care than dogs, making them popular pets for people with busy lifestyles.",
  ].join(" "),
};

// ----- test setup --------------------------------------------------
beforeAll(async () => {
  // Clean up from previous runs
  await db.delete(chunks);

  // Chunk and embed seed documents
  const allChunks = [
    ...chunkDocument({
      docId: DOG_DOC.docId,
      content: DOG_DOC.content,
      modelVersion: modelVersion(),
    }),
    ...chunkDocument({
      docId: CAT_DOC.docId,
      content: CAT_DOC.content,
      modelVersion: modelVersion(),
    }),
  ];

  const contents = allChunks.map((c) => c.content);
  const embeddings = await embed(contents);

  // Insert into DB
  for (let i = 0; i < allChunks.length; i++) {
    const chunk = allChunks[i]!;
    const embedding = embeddings[i]!;
    await db.insert(chunks).values({
      docId: chunk.docId,
      chunkIndex: chunk.chunkIndex,
      content: chunk.content,
      embedding,
      modelVersion: chunk.modelVersion,
      contentHash: chunk.contentHash,
    });
  }
}, 120_000); // model download may take a while on first run

afterAll(async () => {
  // Clean up after all tests in this file
  await db.delete(chunks);
});

// ----- tests -------------------------------------------------------
describe("GET /health", () => {
  it("returns ok status", async () => {
    const res = await app.request("/health");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: "ok" });
  });
});

describe("POST /search", () => {
  it("returns 400 for missing query", async () => {
    const res = await app.request("/search", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(400);
  });

  it("returns 400 for empty query string", async () => {
    const res = await app.request("/search", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ query: "" }),
    });
    expect(res.status).toBe(400);
  });

  it("returns results for a valid query", async () => {
    const res = await app.request("/search", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ query: "dog training techniques" }),
    });
    expect(res.status).toBe(200);
    const rows = (await res.json()) as unknown[];
    expect(rows.length).toBeGreaterThan(0);
  });

  it("ranks semantically relevant documents first", async () => {
    const res = await app.request("/search", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ query: "canine training and behavior" }),
    });
    expect(res.status).toBe(200);
    const rows = (await res.json()) as Array<{ docId: string; score: number }>;
    expect(rows.length).toBeGreaterThanOrEqual(2);

    // The dog document should rank above the cat document
    // (lower cosine distance = more similar)
    const topDocIds = rows.slice(0, 2).map((r) => r.docId);
    expect(topDocIds).toContain("seed/dogs");
    const dogIdx = topDocIds.indexOf("seed/dogs");
    const catIdx = topDocIds.indexOf("seed/cats");
    expect(dogIdx).toBeLessThan(catIdx);
  });

  it("respects the topK parameter", async () => {
    const res = await app.request("/search", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ query: "pet animals", topK: 1 }),
    });
    expect(res.status).toBe(200);
    const rows = (await res.json()) as unknown[];
    expect(rows).toHaveLength(1);
  });

  it("returns score and content fields for each result", async () => {
    const res = await app.request("/search", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ query: "domestic animals" }),
    });
    expect(res.status).toBe(200);
    const rows = (await res.json()) as Array<Record<string, unknown>>;
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) {
      expect(row).toHaveProperty("docId");
      expect(row).toHaveProperty("chunkIndex");
      expect(row).toHaveProperty("content");
      expect(row).toHaveProperty("score");
    }
  });
});
