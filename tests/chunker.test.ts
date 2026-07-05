import { describe, expect, it } from "vitest";
import {
  chunkDocument,
  estimateTokens,
  splitByCharacter,
  splitByHeadings,
} from "../src/chunker.js";
import type { Chunk } from "../src/chunker.js";

// ----- helpers -----------------------------------------------------
function sumChars(chunks: Pick<Chunk, "content">[]): number {
  return chunks.reduce((s, c) => s + c.content.length, 0);
}

function chunkCharSizes(chunks: Pick<Chunk, "content">[]): number[] {
  return chunks.map((c) => c.content.length);
}

// ----- estimateTokens -----------------------------------------------
describe("estimateTokens", () => {
  it("returns ceil(chars / 4)", () => {
    expect(estimateTokens("")).toBe(0);
    expect(estimateTokens("abcd")).toBe(1);
    expect(estimateTokens("abcde")).toBe(2); // 5 chars → 2 tokens
    expect(estimateTokens("12345678")).toBe(2); // 8 chars → 2 tokens
  });
});

// ----- splitByCharacter ---------------------------------------------
describe("splitByCharacter", () => {
  it("returns empty array for empty input", () => {
    expect(splitByCharacter("", 10).length).toBe(0);
  });

  it("returns single chunk when content fits", () => {
    const chunks = splitByCharacter("short text", 100);
    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toBe("short text");
  });

  it("produces overlapping chunks for long content", () => {
    // 120 'x' chars = 30 tokens. maxTokens=10 (40 chars), overlap=20% (stride=32)
    const long = "x".repeat(120);
    const chunks = splitByCharacter(long, 10, 20);

    // Should produce multiple chunks
    expect(chunks.length).toBeGreaterThan(1);

    // Every chunk should be ≤ maxChars (40) + some slack for boundary extension
    for (const c of chunks) {
      expect(c.length).toBeLessThanOrEqual(44);
    }

    // No chunk should be empty
    for (const c of chunks) {
      expect(c.length).toBeGreaterThan(0);
    }
  });

  it("overlap carries content between consecutive chunks", () => {
    const text = "abcdefghij. klmnopqrst. uvwxyzabcd. efghijklmn. opqrstuvwx. yz";
    const chunks = splitByCharacter(text, 5); // maxChars = 20

    // Consecutive chunks should share some characters
    for (let i = 1; i < chunks.length; i++) {
      const prevEnd = chunks[i - 1]!.slice(-10);
      const nextStart = chunks[i]!.slice(0, 10);
      const overlap = [...prevEnd].filter((c) => nextStart.includes(c)).length;
      expect(overlap).toBeGreaterThan(0);
    }
  });

  it("cuts at sentence boundaries when available", () => {
    const text = "This is sentence one. This is sentence two. This is sentence three. End.";
    const chunks = splitByCharacter(text, 6, 20);

    for (const c of chunks) {
      expect(c.length).toBeGreaterThan(0);
    }
    // Most non-last chunks should end at a natural break
    const sentenceEnding = chunks.slice(0, -1).filter((c) => /[.!?]\s*$/.test(c));
    expect(sentenceEnding.length).toBeGreaterThanOrEqual(Math.floor((chunks.length - 1) / 2));
  });
});

// ----- splitByHeadings ----------------------------------------------
describe("splitByHeadings", () => {
  const mdDoc = `# Introduction
This is the introduction. It talks about what the project does.

## Getting Started
To get started, install the dependencies and run the setup script.

### Configuration
Place the configuration file in the root directory.

It supports both JSON and YAML formats.
`;

  it("splits markdown into heading sections", () => {
    const sections = splitByHeadings(mdDoc, 200);
    expect(sections).toHaveLength(3);
    expect(sections[0]).toContain("This is the introduction");
    expect(sections[1]).toContain("install the dependencies");
    expect(sections[2]).toContain("JSON and YAML");
  });

  it("keeps heading text in the section content", () => {
    const sections = splitByHeadings(mdDoc, 200);
    expect(sections[0]).toContain("Introduction");
    expect(sections[1]).toContain("Getting Started");
    expect(sections[2]).toContain("Configuration");
  });

  it("forwards oversized sections to character splitter", () => {
    // maxTokens=5 → maxChars=20 — every section will be oversized
    const sections = splitByHeadings(mdDoc, 5);
    expect(sections.length).toBeGreaterThan(3); // split further
    for (const s of sections) {
      expect(s.length).toBeGreaterThan(0);
      expect(s.length).toBeLessThanOrEqual(24); // maxChars + slack
    }
  });
});

// ----- chunkDocument (integration) ----------------------------------
describe("chunkDocument", () => {
  const modelVersion = "test-model/v1";

  it("returns empty array for empty content", () => {
    const chunks = chunkDocument({
      docId: "d1",
      content: "",
      modelVersion,
    });
    expect(chunks).toHaveLength(0);
  });

  it("returns single chunk for tiny markdown content", () => {
    const chunks = chunkDocument({
      docId: "d1",
      content: "# Title\n\nOne paragraph.",
      modelVersion,
    });
    expect(chunks).toHaveLength(1);
    expect(chunks[0]!.docId).toBe("d1");
    expect(chunks[0]!.chunkIndex).toBe(0);
    expect(chunks[0]!.content).toContain("Title");
    expect(chunks[0]!.modelVersion).toBe(modelVersion);
  });

  it("attaches correct chunkIndex values", () => {
    const longText = `# Doc\n\n${"word ".repeat(200)}`;
    const chunks = chunkDocument({ docId: "d1", content: longText, modelVersion }, 20);
    expect(chunks.length).toBeGreaterThan(1);
    chunks.forEach((c, i) => expect(c.chunkIndex).toBe(i));
  });

  it("produces deterministic content hashes", () => {
    const input = { docId: "d1", content: "hello world", modelVersion };
    const a = chunkDocument(input);
    const b = chunkDocument(input);
    expect(a).toHaveLength(1);
    expect(b).toHaveLength(1);
    expect(a[0]!.contentHash).toBe(b[0]!.contentHash);
  });

  it("different chunkIndex produces different hash", () => {
    const longText = `# Doc\n\n${"word ".repeat(200)}`;
    const chunks = chunkDocument({ docId: "d1", content: longText, modelVersion }, 20);
    expect(chunks.length).toBeGreaterThan(1);
    const hashes = chunks.map((c) => c.contentHash);
    expect(new Set(hashes).size).toBe(hashes.length);
  });

  it("different docId produces different hash for same content", () => {
    const content = "same text";
    const a = chunkDocument({
      docId: "d1",
      content,
      modelVersion,
    })[0]!;
    const b = chunkDocument({
      docId: "d2",
      content,
      modelVersion,
    })[0]!;
    expect(a.contentHash).not.toBe(b.contentHash);
  });

  it("plain text goes through the character path", () => {
    const text = "Just some plain text. No markdown here. Another sentence.";
    const chunks = chunkDocument({ docId: "d1", content: text, modelVersion }, 10);
    expect(chunks.length).toBeGreaterThan(1);
  });

  it("never loses content (no silent truncation)", () => {
    const text = `# Doc\n\nThe ${"quick ".repeat(50)} fox.`;
    const chunks = chunkDocument({ docId: "d1", content: text, modelVersion }, 20);
    // Total chars across chunks should be ≥ original (overlap adds extra)
    expect(sumChars(chunks)).toBeGreaterThanOrEqual(text.length);
  });

  it("all chunks respect the max-token ceiling", () => {
    const text = `# Doc\n\nThe ${"quick ".repeat(100)} fox.`;
    const maxTokens = 30;
    const maxChars = maxTokens * 4;
    const chunks = chunkDocument({ docId: "d1", content: text, modelVersion }, maxTokens);
    const sizes = chunkCharSizes(chunks);
    for (const size of sizes) {
      expect(size).toBeLessThanOrEqual(maxChars * 1.3); // generous slack for boundary
    }
  });
});
