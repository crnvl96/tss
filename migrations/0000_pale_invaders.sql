CREATE TABLE "chunks" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"doc_id" text NOT NULL,
	"chunk_index" integer NOT NULL,
	"content" text NOT NULL,
	"embedding" vector(384) NOT NULL,
	"model_version" text NOT NULL,
	"content_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "chunks_content_hash_uq" ON "chunks" USING btree ("content_hash");