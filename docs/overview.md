# Overview

A multi-step ingestion pipeline that produces and stores embeddings.

Upload markdown, text, or PDF documents. A Temporal workflow chunks each
one, calls a local embedding model, and writes chunks + vectors to
Postgres. A `/search` endpoint embeds the query and returns the top-k
matches from pgvector with citations.

## Stack

- **Runtime**: Node.js >= 24, ESM (provision via `mise install`; see `mise.toml`)
- **HTTP**: Hono + `@hono/node-server`; validation via `zod` + `@hono/zod-validator`
- **Orchestration**: Temporal (`@temporalio/*`)
- **Storage**: Postgres + `pgvector` via Drizzle ORM; migrations via Drizzle Kit
- **Embeddings**: local via `@huggingface/transformers` (default `Xenova/all-MiniLM-L6-v2`, 384 dims)
- **Parsing**: `markdown-it` (chunking), `unpdf` (PDFs)
- **Logging**: `pino`
- **Tooling**: TypeScript via `tsgo`; quality via `oxlint`/`oxfmt`/`vitest`
