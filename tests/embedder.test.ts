import { beforeEach, describe, expect, it, vi } from "vitest";
import { embed, modelVersion } from "../src/embedder.js";

// ----- mock helpers -------------------------------------------------
function fakeVector(): number[] {
  return Array.from({ length: 384 }, () => Math.random());
}

function fakeTensor(vectors: number[][]): { tolist: () => number[][] } {
  return { tolist: () => vectors };
}

// ----- mock pipeline ------------------------------------------------
vi.mock("@huggingface/transformers", () => {
  let singleton: unknown = null;

  return {
    pipeline: vi.fn(async (_task: string, _model: string) => {
      if (singleton) return singleton;

      singleton = async (input: string | string[], _options?: Record<string, unknown>) => {
        if (Array.isArray(input)) {
          return fakeTensor(input.map(() => fakeVector()));
        }
        return fakeTensor([fakeVector()]);
      };

      return singleton;
    }),
  };
});

// ----- tests --------------------------------------------------------
beforeEach(() => {
  vi.clearAllMocks();
});

describe("modelVersion", () => {
  it("returns the configured default model", () => {
    expect(modelVersion()).toBe("Xenova/all-MiniLM-L6-v2");
  });
});

describe("embed", () => {
  it("returns a 384-element array for a single text", async () => {
    const vec = await embed("hello world");
    expect(vec).toHaveLength(384);
    expect(vec.every((v) => typeof v === "number")).toBe(true);
    expect(vec.some((v) => v !== 0)).toBe(true);
  });

  it("returns N 384-element arrays for a batch of N texts", async () => {
    const texts = ["a", "b", "c"];
    const vecs = await embed(texts);
    expect(vecs).toHaveLength(3);
    for (const v of vecs) {
      expect(v).toHaveLength(384);
    }
  });

  it("returns different vectors for different inputs", async () => {
    const a = await embed("text one");
    const b = await embed("text two");
    expect(a).toHaveLength(384);
    expect(b).toHaveLength(384);
    const sameCount = a.filter((v, i) => v === b[i]).length;
    expect(sameCount).toBeLessThan(384);
  });

  it("returns the same vector shape for empty string", async () => {
    const vec = await embed("");
    expect(vec).toHaveLength(384);
  });
});
