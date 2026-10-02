import { processDueJobs } from "../lib/queue";

const INTERVAL_MS = 60_000; // run every minute

async function run() {
  console.log("[sms-worker] starting");
  while (true) {
    try {
      await processDueJobs();
    } catch (err) {
      console.error("[sms-worker] error:", err);
    }
    await new Promise((r) => setTimeout(r, INTERVAL_MS));
  }
}

run();
