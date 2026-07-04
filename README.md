# tss — Semantic Document Search

Upload markdown, text, or PDF documents. Ask natural-language questions. Get
back the most relevant passages with citations.

Under the hood: a Temporal workflow chunks each document, calls a local
embedding model, and stores chunks + vectors in Postgres (with the `pgvector`
extension). A `/search` endpoint embeds the query and returns the top-k
matches via pgvector similarity search.

See [`docs/scope.md`](docs/scope.md) for the full design and **Key Technical
Decisions**, [`docs/dependencies.md`](docs/dependencies.md) for the dependency
list, or [`AGENTS.md`](AGENTS.md) for AI-agent orientation.

## Quickstart

Prerequisites: [mise](https://mise.jdx.dev/) (for the pinned Node version)
and Docker (for the Postgres container).

```bash
# 1. Provision the pinned Node version
mise install

# 2. Install JS dependencies
npm install

# 3. Create your local .env from the template
cp .env.example .env

# 4. Start the Postgres+pgvector container (pulls the image on first run)
npm run db:up

# 5. Start the dev loop in two terminals
# Terminal A — recompile on change:
npm run dev
# Terminal B — restart the app on `dist/` change:
node --watch dist/index.js
```

The app's entry is `dist/index.js` (matches `package.json#main`).

## NPM Scripts

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

## Documentation

- [`docs/scope.md`](docs/scope.md) — project scope, stack, and **Key Technical Decisions** (source of truth for chunking strategy, idempotency, schema versioning, env loading, dev runner).
- [`docs/dependencies.md`](docs/dependencies.md) — runtime, dev, and non-npm dependencies with install notes.
- [`AGENTS.md`](AGENTS.md) — agent-oriented project guide (stack, layout, dev workflow).
