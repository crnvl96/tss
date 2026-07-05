import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import { modelVersion } from "../embedder.js";
import { getClient } from "../temporal/client.js";
import { ingestWorkflow } from "../workflows/ingest.js";

// ----- schema ------------------------------------------------------
const ingestSchema = z.object({
  docId: z.string().min(1),
  content: z.string().min(1),
});

// ----- route -------------------------------------------------------
const TASK_QUEUE = "tss-ingest";

export const ingestRoute = new Hono().post("/", zValidator("json", ingestSchema), async (c) => {
  const { docId, content } = c.req.valid("json");
  const version = modelVersion();

  const client = await getClient();
  const handle = await client.workflow.start(ingestWorkflow, {
    taskQueue: TASK_QUEUE,
    workflowId: `ingest-${docId}-${Date.now()}`,
    args: [docId, content, version],
  });

  return c.json({ workflowId: handle.workflowId }, 202);
});
