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

## NPM Scripts at a Glance

- **Build/dev**: `dev`, `build`, `start`, `typecheck`
- **Quality**: `lint`, `lint:fix`, `format`, `format:check`, `test`, `test:watch`, `quality`
- **Database**: `db:up`, `db:down`, `db:reset`, `db:logs`

See [`AGENTS.md`](AGENTS.md) for the full table with the exact commands.

## Documentation

- [`docs/scope.md`](docs/scope.md) — project scope, stack, and **Key Technical Decisions** (source of truth for chunking strategy, idempotency, schema versioning, env loading, dev runner).
- [`docs/dependencies.md`](docs/dependencies.md) — runtime, dev, and non-npm dependencies with install notes.
- [`AGENTS.md`](AGENTS.md) — agent-oriented project guide (script reference, layout, dev workflow).
