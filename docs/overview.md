# Overview

A multi-step ingestion pipeline that produces and stores embeddings.

Upload markdown, text, or PDF documents. A Temporal workflow chunks each
one, calls a local embedding model, and writes chunks + vectors to
Postgres. A `/search` endpoint embeds the query and returns the top-k
matches from pgvector with citations.
