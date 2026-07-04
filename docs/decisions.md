# Technical Decisions

The chosen approach for each significant technical question in the project.
These are the source of truth; consult them before changing the relevant code.

1. **Local embeddings** — via `@huggingface/transformers` (no API key). Default model: `Xenova/all-MiniLM-L6-v2` (384 dims).

2. **Local infra** — Temporal CLI for the dev server; `pgvector/pgvector:pg18` Postgres+pgvector container orchestrated via `docker compose`; Drizzle Kit for migrations.

3. **HTTP layer** — Hono with `@hono/node-server` for the Node 24 adapter; `zod` + `@hono/zod-validator` for typed request/response validation.

4. **Chunking** — `markdown-it` AST + custom recursive splitter (~80–150 LOC). Splits at heading boundaries first, then by character with overlap. Target: 500–800 tokens, 10–20% overlap.

5. **PDF parsing** — `unpdf` (modern, ESM, lightweight).

6. **Idempotency** — `sha256(doc_id + chunk_index + content)` for hash-based chunk dedup so Temporal retries are safe.

7. **Schema versioning** — `model_version` column on the chunks table to support selective re-embedding when the model changes.

8. **Health + observability** — `/health` endpoint on the API; structured logs via `pino`; one log line per workflow activity. Workflow history only helps if logs correlate.

9. **Environment loading** — `node --env-file=.env` (Node 20.6+ built-in; no `dotenv` dep).

10. **Dev runner** — `tsgo --watch` (compile + typecheck) running alongside `node --watch dist/index.js` (restart on change). Two terminals.
