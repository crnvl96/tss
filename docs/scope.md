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

1. Embeddings

Local via `transformers.js`.

2. Local infra

- `Temporal` CLI for the dev server
- `pgvector/pgvector:pg16` Docker image is the cleanest Postgres path
- Drizzle Kit for migrations.

3. HTTP layer

Hono

4. Chunking strategy

For markdown, a recursive splitter with markdown-aware boundaries (split on headings, then by chars) is the sweet spot. Document the token/char target (e.g., 500–800 tokens, 10–20% overlap).

5. PDF parsing

`unpdf` (modern, ESM, lightweight)

6. Idempotency

Temporal retries activities. Hash-based dedup of chunks (e.g., `sha256(doc_id + chunk_index + content)`) makes re-runs safe and the demo resilient.

7. `model_version` column on the chunks table.

Cheap insurance: when you swap `all-MiniLM-L6-v2` for something else later, you can re-embed selectively instead of nuking the table.

8. Health + observability basics

`/health` for the API, structured logs [pino](https://github.com/pinojs/pino), one log line per workflow activity. Boring, but the workflow history only helps if logs correlate.
