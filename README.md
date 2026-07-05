# tss — Semantic Document Search

Upload markdown, text, or PDF documents. Ask natural-language questions. Get
back the most relevant passages with citations.

Under the hood: a Temporal workflow chunks each document, calls a local
embedding model, and stores chunks + vectors in Postgres (with the `pgvector`
extension). A `/search` endpoint embeds the query and returns the top-k
matches via pgvector similarity search.

## Quickstart

Prerequisites: [mise](https://mise.jdx.dev/) (for the pinned Node version)
and Docker (for Postgres **and** Temporal).

### 1. Provision the runtime

```bash
mise install          # install the pinned Node version
npm install           # install JS dependencies
cp .env.example .env  # create your local .env
```

### 2. Start infrastructure (Postgres + Temporal)

```bash
# Start the Postgres+pgvector container (pulls the image on first run)
npm run db:up

# Enable the pgvector extension and apply the schema
npm run db:init
npm run db:migrate
```

Temporal requires its own server to manage workflows. Start one with Docker:

```bash
docker run -d --name tss-temporal \
  -p 7233:7233 \
  temporalio/auto-setup:latest
```

> **Note:** Starting `temporalio/auto-setup` for the first time can take 30–60
> seconds. Wait until `docker logs tss-temporal` shows `"Temporal server is ready"`.

### 3. Start the services

Open three terminals:

```bash
# Terminal A — recompile TypeScript on change
npm run dev

# Terminal B — run the Temporal worker (processes ingest tasks)
npm run worker

# Terminal C — start the API server (hot-reloads on recompile)
node --watch dist/main.js
```

The API listens on `http://localhost:3000` (set `PORT` in `.env` to override).

### 4. Ingest a document

Send text content to the `/ingest` endpoint. The server starts a Temporal
workflow that chunks the text, generates embeddings, and stores everything in
Postgres.

```bash
curl -sS -X POST http://localhost:3000/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "docId": "my-doc",
    "content": "Vector databases store data as high-dimensional vectors and enable similarity search. Postgres supports this with the pgvector extension, which adds a vector column type and cosine distance operators."
  }'
# → {"workflowId":"ingest-my-doc-..."}
```

The `workflowId` in the response confirms the job was accepted. The worker
(Terminal B) picks it up automatically. Ingestion is **idempotent** — re-sending
the same `docId` and `content` will not create duplicate chunks.

### 5. Search

Query the `/search` endpoint with a natural-language question. The server
embeds your query, compares it against stored chunks via cosine similarity, and
returns the best matches ranked by relevance.

```bash
curl -sS -X POST http://localhost:3000/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "what database extensions support vector search?",
    "topK": 3
  }'
```

Each result includes:

| Field        | Description                               |
| ------------ | ----------------------------------------- |
| `docId`      | The document the chunk came from          |
| `chunkIndex` | Position of the chunk within the document |
| `content`    | The chunk text                            |
| `score`      | Cosine distance (lower = more similar)    |

The `topK` parameter is optional (defaults to 10, capped at 100).

### Optional: seed with sample data

The test suite seeds two documents (`seed/dogs` and `seed/cats`) you can use
for quick experimentation:

```bash
npm test
```

After the tests pass the seeded chunks remain in Postgres. Try:

```bash
curl -sS -X POST http://localhost:3000/search \
  -H "Content-Type: application/json" \
  -d '{"query": "canine training techniques"}'
```

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
| `worker`       | `node --env-file=.env scripts/worker.mjs`                 | Run the Temporal worker. Picks up and processes ingest workflows. Must run alongside the API server.                              |
| `db:down`      | `docker compose down`                                     | Stop the container. Preserves the `tss-pgdata` volume.                                                                            |
| `db:reset`     | `docker compose down -v && docker compose up -d postgres` | Wipe the data volume and restart the container from scratch. Run `db:init` + `db:migrate` afterwards.                             |
| `db:logs`      | `docker compose logs -f postgres`                         | Tail the Postgres container logs.                                                                                                 |
