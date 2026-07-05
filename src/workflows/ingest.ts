import { proxyActivities } from "@temporalio/workflow";
import type * as activities from "../activities/chunk.js";
import type * as embedActivities from "../activities/embed.js";
import type * as storeActivities from "../activities/store.js";

const { chunkActivity } = proxyActivities<typeof activities>({
  startToCloseTimeout: "2 minutes",
});

const { embedActivity } = proxyActivities<typeof embedActivities>({
  startToCloseTimeout: "5 minutes",
});

const { storeActivity } = proxyActivities<typeof storeActivities>({
  startToCloseTimeout: "1 minute",
});

export async function ingestWorkflow(
  docId: string,
  content: string,
  modelVersion: string,
): Promise<void> {
  const chunkResults = await chunkActivity({ docId, content, modelVersion });
  const texts = chunkResults.map((c) => c.content);
  const embeddings = await embedActivity(texts);
  await storeActivity({ chunks: chunkResults, embeddings });
}
