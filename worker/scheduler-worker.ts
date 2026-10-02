import { prisma } from "../lib/prisma";

// Checks every minute for campaigns that should transition to "running" or "completed"
async function syncCampaignStatuses() {
  const running = await prisma.campaign.findMany({
    where: { status: { in: ["scheduled", "running"] } },
  });

  for (const campaign of running) {
    const pendingJobs = await prisma.smsQueue.count({
      where: { campaignId: campaign.id, status: "pending" },
    });

    if (pendingJobs === 0 && campaign.pending === 0) {
      await prisma.campaign.update({
        where: { id: campaign.id },
        data: { status: "completed" },
      });
    } else if (campaign.sent > 0 && campaign.status === "scheduled") {
      await prisma.campaign.update({
        where: { id: campaign.id },
        data: { status: "running" },
      });
    }
  }
}

const INTERVAL_MS = 60_000;

async function run() {
  console.log("[scheduler-worker] starting");
  while (true) {
    try {
      await syncCampaignStatuses();
    } catch (err) {
      console.error("[scheduler-worker] error:", err);
    }
    await new Promise((r) => setTimeout(r, INTERVAL_MS));
  }
}

run();
