# Core Idea

A multi-step pipeline that produces and stores embeddings

## The stack

- **Temporal** orchestrates the multi-step ingestion (fetch → parse → chunk → embed → store) with retries, timeouts, and a visible workflow history.
- **pgvector** stores the embeddings and powers similarity search.
- **Drizzle** defines the schema (including the `vector` column), migrations, and typed queries for everything.

## Project: Semantic Document Search

An API where you upload markdown/text/PDFs. A Temporal workflow chunks each doc, calls an embedding model, and writes chunks + vectors to Postgres. A `/search` endpoint embeds the query and returns top-k from pgvector.

## Demo

Upload a doc, ask a natural-language question, get back the most relevant passages with citations.

## Key Technical Decisions

1. **Embeddings**: local via `@huggingface/transformers` (no API key). Default model: `Xenova/all-MiniLM-L6-v2` (384 dims).

2. **Local infra**:
   - Temporal CLI for the dev server
   - `pgvector/pgvector:pg16` Docker image for Postgres
   - Drizzle Kit for migrations

3. **HTTP layer**: Hono with `@hono/node-server` for the Node 24 adapter; `zod` + `@hono/zod-validator` for typed request/response validation.

4. **Chunking**: `markdown-it` AST + custom recursive splitter (~80–150 LOC). Splits at heading boundaries first, then by character with overlap. Target: 500–800 tokens, 10–20% overlap.

5. **PDF parsing**: `unpdf` (modern, ESM, lightweight).

6. **Idempotency**: `sha256(doc_id + chunk_index + content)` for hash-based chunk dedup so Temporal retries are safe.

7. **Schema versioning**: `model_version` column on the chunks table to support selective re-embedding when the model changes.

8. **Health + observability**: `/health` endpoint on the API; structured logs via `pino`; one log line per workflow activity. Workflow history only helps if logs correlate.

9. **Environment loading**: `node --env-file=.env` (Node 20.6+ built-in; no `dotenv` dep).

10. **Dev runner**: `tsgo --watch` (compile + typecheck) running alongside `node --watch dist/index.js` (restart on change). Two terminals, or wrap in a `dev` script that joins them.
