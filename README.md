# tss — Semantic Document Search

Upload markdown, text, or PDF documents. Ask natural-language questions. Get
back the most relevant passages with citations.

Under the hood: a Temporal workflow chunks each document, calls a local
embedding model, and stores chunks + vectors in Postgres (with the `pgvector`
extension). A `/search` endpoint embeds the query and returns the top-k
matches via pgvector similarity search.

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

# 5. Enable the pgvector extension and apply the schema
npm run db:init
npm run db:migrate

# 6. Start the dev loop in two terminals
# Terminal A — recompile on change:
npm run dev
# Terminal B — restart the app on `dist/` change:
node --watch dist/main.js
```

The app's entry is `dist/main.js` (matches `package.json#main`).

## NPM Scripts

| Script         | Command                                                   | When to use                                                                                                                       |
| -------------- | --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `dev`          | `tsgo --watch`                                            | Active development. Recompiles on change; pair with `node --watch dist/main.js` in a second terminal to actually restart the app. |
| `build`        | `tsgo`                                                    | Produce a fresh `dist/` for production.                                                                                           |
| `start`        | `node dist/main.js`                                       | Run the compiled app. Requires a prior `build`.                                                                                   |
| `typecheck`    | `tsgo --noEmit -p tsconfig.test.json`                     | Type-check without emitting. Cheap; safe to run any time.                                                                         |
| `test`         | `vitest run --passWithNoTests`                            | Run the full test suite once (CI-friendly).                                                                                       |
| `test:watch`   | `vitest`                                                  | Run tests in watch mode during development.                                                                                       |
| `lint`         | `oxlint .`                                                | Check for lint issues.                                                                                                            |
| `lint:fix`     | `oxlint . --fix`                                          | Auto-fix lint issues.                                                                                                             |
| `format`       | `oxfmt`                                                   | Format all files.                                                                                                                 |
| `format:check` | `oxfmt --check`                                           | Verify formatting without changing files (CI-friendly).                                                                           |
| `quality`      | `format:check && lint && typecheck && test`               | Full quality gate. Run before opening a PR or pushing.                                                                            |
| `db:up`        | `docker compose up -d postgres`                           | Start the Postgres+pgvector container in the background. First run pulls the image.                                               |
| `db:init`      | `node --env-file=.env scripts/db-init.mjs`                | Enable the `vector` extension in the Postgres container. Idempotent — safe to run multiple times.                                 |
| `db:generate`  | `drizzle-kit generate`                                    | Generate SQL migration files from `src/db/schema.ts`.                                                                             |
| `db:migrate`   | `drizzle-kit migrate`                                     | Apply pending migrations to the dev container.                                                                                    |
| `db:down`      | `docker compose down`                                     | Stop the container. Preserves the `tss-pgdata` volume.                                                                            |
| `db:reset`     | `docker compose down -v && docker compose up -d postgres` | Wipe the data volume and restart the container from scratch. Run `db:init` + `db:migrate` afterwards.                             |
| `db:logs`      | `docker compose logs -f postgres`                         | Tail the Postgres container logs.                                                                                                 |

