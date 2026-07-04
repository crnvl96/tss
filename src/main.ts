import { serve } from "@hono/node-server";
import { app } from "./server.js";
import { logger } from "./logger.js";

const port = Number(process.env.PORT ?? 3000);

serve({ fetch: app.fetch, port }, (info) => {
  logger.info({ port: info.port }, "api listening");
});
