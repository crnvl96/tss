import { runWorker } from "../dist/temporal/worker.js";

await runWorker();
console.log("Worker is running (Ctrl+C to stop)");
