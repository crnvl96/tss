# AGENTS.md

Quick orientation for AI coding agents working in this repo.

## Project Goal

**Semantic Document Search** — an API where you upload markdown/text/PDFs. A Temporal workflow chunks each document, calls a local embedding model, and writes chunks + vectors to Postgres. A `/search` endpoint embeds the query and returns the top-k most relevant passages with citations.

## Stack

- **Runtime**: Node.js >= 24, ESM (`"type": "module"`)
  - Node version is managed via [mise](https://mise.jdx.dev/) — see `mise.toml` which pins `node = "24"`. Run `mise install` (or `mise use` on first clone) to provision the right Node before running `npm` scripts. Don't rely on a system Node that happens to be >=24; mise keeps the team in sync.
- **HTTP**: Hono + `@hono/node-server`
- **Validation**: zod + `@hono/zod-validator`
- **Orchestration**: Temporal (`@temporalio/client`, `worker`, `workflow`, `activity`)
- **Storage**: Postgres + `pgvector` via Drizzle ORM, migrations via Drizzle Kit
- **Embeddings**: local via `@huggingface/transformers` (default model `Xenova/all-MiniLM-L6-v2`, 384 dims)
- **Parsing**: `markdown-it` (chunking), `unpdf` (PDFs)
- **Logging**: `pino`
- **Language/tooling**: TypeScript compiled with `tsgo` (`@typescript/native-preview`)
- **Quality**: `oxlint`, `oxfmt`, `vitest`

## Project Docs

Read the docs under `docs/` before making non-trivial changes:

- **`docs/scope.md`** — full project scope, demo, and the **Key Technical Decisions** section. Treat that section as the source of truth for chunking strategy, idempotency hash, `model_version` schema, environment loading (`node --env-file`), and the dev runner setup.
- **`docs/dependencies.md`** — complete list of runtime, dev, and non-npm dependencies with install notes.

When answering questions about behavior, design choices, or which package to use, consult these first rather than guessing from `node_modules` or memory.

## NPM Scripts

Run with `npm run <name>`.

| Script         | Command                                                   | When to use                                                                                                                        |
| -------------- | --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `dev`          | `tsgo --watch`                                            | Active development. Recompiles on change; pair with `node --watch dist/index.js` in a second terminal to actually restart the app. |
| `build`        | `tsgo`                                                    | Produce a fresh `dist/` for production.                                                                                            |
| `start`        | `node dist/index.js`                                      | Run the compiled app. Requires a prior `build`.                                                                                    |
| `typecheck`    | `tsgo --noEmit`                                           | Type-check without emitting. Cheap; safe to run any time.                                                                          |
| `test`         | `vitest run --passWithNoTests`                            | Run the full test suite once (CI-friendly).                                                                                        |
| `test:watch`   | `vitest`                                                  | Run tests in watch mode during development.                                                                                        |
| `lint`         | `oxlint .`                                                | Check for lint issues.                                                                                                             |
| `lint:fix`     | `oxlint . --fix`                                          | Auto-fix lint issues.                                                                                                              |
| `format`       | `oxfmt`                                                   | Format all files.                                                                                                                  |
| `format:check` | `oxfmt --check`                                           | Verify formatting without changing files (CI-friendly).                                                                            |
| `quality`      | `format:check && lint && typecheck && test`               | Full quality gate. Run before opening a PR or pushing.                                                                             |
| `db:up`        | `docker compose up -d postgres`                           | Start the Postgres+pgvector container in the background. First run pulls the image.                                                |
| `db:down`      | `docker compose down`                                     | Stop the container. Preserves the `tss-pgdata` volume.                                                                             |
| `db:reset`     | `docker compose down -v && docker compose up -d postgres` | Wipe the data volume and restart the container from scratch.                                                                       |
| `db:logs`      | `docker compose logs -f postgres`                         | Tail the Postgres container logs.                                                                                                  |

### Dev runner reminder

Prerequisite: the Postgres+pgvector container must be up before the app can talk to the database. Start it with `npm run db:up` and wait for the healthcheck to pass.

`tsgo --watch` only recompiles — it does not restart Node. For a real hot-reload loop, run **both**:

1. `npm run dev` — recompile on change
2. `node --watch dist/index.js` — restart Node on `dist/` change

## Project Layout

- `src/` — TypeScript source
- `dist/` — `tsgo` build output; the app's entry is `dist/index.js` (matches `package.json#main`)
- `docs/` — project documentation
- `docker-compose.yml` — Postgres+pgvector service definition for local dev
- `.env.example` — template for the env vars consumed by Compose and the app
- `tsconfig.json` — TypeScript configuration
- `package.json` — scripts, dependencies, Node engine pin (`>=24`)
- `mise.toml` — pins `node = "24"`; run `mise install` to provision the matching Node
