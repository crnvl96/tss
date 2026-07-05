import { createHash } from "node:crypto";
import MarkdownIt from "markdown-it";

// ----- constants --------------------------------------------------
const CHARS_PER_TOKEN = 4;
const DEFAULT_MAX_TOKENS = 500;
const DEFAULT_OVERLAP_PERCENT = 20;

// ----- types ------------------------------------------------------
export interface ChunkInput {
  docId: string;
  content: string;
  modelVersion: string;
}

export interface Chunk {
  docId: string;
  chunkIndex: number;
  content: string;
  contentHash: string;
  modelVersion: string;
}

// ----- token estimation --------------------------------------------
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}

// ----- format detection --------------------------------------------
function isMarkdown(content: string): boolean {
  return /^#{1,6}\s/m.test(content) || /```/.test(content);
}

// ----- markdown heading splitter -----------------------------------
const md = new MarkdownIt();

const TEXT_TOKEN_TYPES = new Set(["inline", "html_block", "fence", "html_inline", "code_block"]);

/**
 * Parse markdown content and split into sections at heading boundaries.
 * Sections that exceed maxTokens are further split with {@link splitByCharacter}.
 */
export function splitByHeadings(content: string, maxTokens: number): string[] {
  const tokens = md.parse(content, {});
  const sections: string[] = [];
  let current = "";

  for (const token of tokens) {
    if (token.type === "heading_open") {
      if (current.trim()) sections.push(current.trim());
      current = "";
    } else if (TEXT_TOKEN_TYPES.has(token.type)) {
      current += token.content;
    }
  }

  if (current.trim()) sections.push(current.trim());

  // Split oversized sections further with the character splitter
  const maxChars = maxTokens * CHARS_PER_TOKEN;
  const result: string[] = [];
  for (const section of sections) {
    if (section.length <= maxChars) {
      result.push(section);
    } else {
      result.push(...splitByCharacter(section, maxTokens));
    }
  }

  return result;
}

// ----- character splitter (sliding window with overlap) ------------
/**
 * Split plain text into overlapping chunks targeting maxTokens each.
 * Tries to cut at paragraph (`\n\n`) or sentence (`. `, `! `, `? `)
 * boundaries near the end of each window.
 */
export function splitByCharacter(
  content: string,
  maxTokens: number,
  overlapPercent: number = DEFAULT_OVERLAP_PERCENT,
): string[] {
  const maxChars = maxTokens * CHARS_PER_TOKEN;
  const overlapChars = Math.floor((maxChars * overlapPercent) / 100);
  const chunks: string[] = [];
  let start = 0;

  while (start < content.length) {
    let end = start + maxChars;
    if (end >= content.length) {
      const last = content.slice(start).trim();
      if (last) chunks.push(last);
      break;
    }

    // Find last natural break inside the window
    const windowText = content.slice(start, end);
    const paraBreak = windowText.lastIndexOf("\n\n");
    const period = windowText.lastIndexOf(". ");
    const exclaim = windowText.lastIndexOf("! ");
    const question = windowText.lastIndexOf("? ");
    const sentenceBreak = Math.max(period, exclaim, question);

    if (paraBreak > maxChars * 0.25) {
      end = start + paraBreak + 2; // include "\n\n"
    } else if (sentenceBreak > maxChars * 0.5) {
      end = start + sentenceBreak + 2; // include ". "
    }

    const chunk = content.slice(start, end).trim();
    if (chunk) chunks.push(chunk);
    start = Math.max(start + 1, end - overlapChars);
  }

  return chunks;
}

// ----- content hash ------------------------------------------------
function contentHash(docId: string, chunkIndex: number, content: string): string {
  return createHash("sha256").update(`${docId}:${chunkIndex}:${content}`).digest("hex");
}

// ----- main chunker ------------------------------------------------
/**
 * Chunk a document into overlapping text segments, each tagged with
 * an idempotent content hash.  Markdown documents are first split at
 * heading boundaries; plain text and PDF-extracted text are split
 * with a sliding window.
 */
export function chunkDocument(input: ChunkInput, maxTokens: number = DEFAULT_MAX_TOKENS): Chunk[] {
  const texts = isMarkdown(input.content)
    ? splitByHeadings(input.content, maxTokens)
    : splitByCharacter(input.content, maxTokens);

  return texts
    .filter((t) => t.trim().length > 0)
    .map((content, i) => ({
      docId: input.docId,
      chunkIndex: i,
      content,
      contentHash: contentHash(input.docId, i, content),
      modelVersion: input.modelVersion,
    }));
}
