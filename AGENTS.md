# AGENTS.md

Quick orientation for AI coding agents working in this repo.

## Project Goal

**Semantic Document Search** — API that ingests markdown/text/PDFs, chunks them via Temporal, embeds locally, stores chunks + vectors in Postgres (pgvector), and serves top-k matches from a `/search` endpoint.

## Stack

- **Runtime**: Node.js >= 24, ESM (provision via `mise install`; see `mise.toml`)
- **HTTP**: Hono + `@hono/node-server`; validation via `zod` + `@hono/zod-validator`
- **Orchestration**: Temporal (`@temporalio/*`)
- **Storage**: Postgres + `pgvector` via Drizzle ORM; migrations via Drizzle Kit
- **Embeddings**: local via `@huggingface/transformers` (default `Xenova/all-MiniLM-L6-v2`, 384 dims)
- **Parsing**: `markdown-it` (chunking), `unpdf` (PDFs)
- **Logging**: `pino`
- **Tooling**: TypeScript via `tsgo`; quality via `oxlint`/`oxfmt`/`vitest`

## Project Docs

Consult before non-trivial changes:

- `docs/scope.md` — scope + **Key Technical Decisions**
- `docs/dependencies.md` — full dependency list
- `README.md` — human entry point, quickstart, and full npm script table

## Dev Workflow

1. `npm run db:up` — start Postgres+pgvector (prerequisite for the app)
2. Two terminals: `npm run dev` (recompile) + `node --watch dist/index.js` (restart Node). See `README.md#quickstart`.

## Project Layout

- `src/` — TypeScript source
- `dist/` — build output (entry: `dist/index.js`)
- `docs/` — design and dependency docs
- `docker-compose.yml` — Postgres service
- `.env.example` — env template
- `tsconfig.json`, `package.json`, `mise.toml`, `.gitignore` — config
