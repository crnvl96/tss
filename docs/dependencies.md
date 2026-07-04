# Dependencies

A concise, complete list of everything the project needs installed.

## Runtime (npm)

1. `hono` — HTTP framework
2. `@hono/node-server` — Node 24 adapter
3. `zod` — request/response schemas
4. `@hono/zod-validator` — typed validation middleware
5. `drizzle-orm` — typed ORM/query builder
6. `pg` — node-postgres driver
7. `@huggingface/transformers` — local embedding runtime
8. `unpdf` — PDF parser
9. `markdown-it` — markdown parser for chunking
10. `@temporalio/client` — Temporal SDK (API/CLI side)
11. `@temporalio/worker` — Temporal SDK (worker process)
12. `@temporalio/workflow` — Temporal SDK (workflow definitions)
13. `@temporalio/activity` — Temporal SDK (activity context/helpers)
14. `pino` — structured logger

## Dev (npm)

15. `drizzle-kit` — migration generation/apply CLI
16. `pino-pretty` — readable dev log output (optional but recommended)
17. `vitest` — test runner

## Not via npm

18. **Temporal CLI** — binary for the dev server. Install via Homebrew (`brew install temporal`) or `temporal.io/download`.
19. **`pgvector/pgvector:pg18` Docker image** — pulled via `docker pull pgvector/pgvector:pg18`.

## Notes

- The embedding model itself (e.g. `Xenova/all-MiniLM-L6-v2`) is downloaded at first use, not declared as a dep.
- `@temporalio/common` is transitive — pulled in by the other `@temporalio/*` packages.
- Drizzle's `pgvector` column type ships in `drizzle-orm` itself (no extra package needed).
