import { NativeConnection, Worker } from "@temporalio/worker";
import * as activities from "../activities/index.js";

const TASK_QUEUE = "tss-ingest";

export async function runWorker(): Promise<void> {
  const connection = await NativeConnection.connect();
  const worker = await Worker.create({
    connection,
    taskQueue: TASK_QUEUE,
    activities,
  });

  await worker.run();
}
