import { Hono } from "hono";
import { logger } from "./logger.js";

export const app = new Hono();

app.use("*", async (c, next) => {
  const start = Date.now();
  await next();
  logger.info(
    {
      method: c.req.method,
      path: c.req.path,
      status: c.res.status,
      ms: Date.now() - start,
    },
    "request",
  );
});

app.get("/", (c) => c.text("hello world"));

app.get("/health", (c) => c.json({ status: "ok" }));
