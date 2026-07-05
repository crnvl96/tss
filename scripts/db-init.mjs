import pg from "pg";

const { Client } = pg;

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const client = new Client(dbUrl);

try {
  await client.connect();
  await client.query("CREATE EXTENSION IF NOT EXISTS vector;");
  console.log("vector extension enabled");
} catch (err) {
  console.error("failed to enable vector extension:", err.message);
  process.exit(1);
} finally {
  await client.end();
}
