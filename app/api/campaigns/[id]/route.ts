import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const [campaign, queueJobs] = await Promise.all([
    prisma.campaign.findUnique({
      where: { id },
      include: { recipients: { include: { customer: true } } },
    }),
    prisma.smsQueue.findMany({
      where: { campaignId: id },
      select: { customerId: true, status: true, scheduledAt: true, twilioSid: true, lastError: true, attempts: true },
    }),
  ]);
  if (!campaign) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Auto-correct campaign status based on actual queue state
  const pendingJobs = queueJobs.filter(j => j.status === "pending" || j.status === "sending").length;
  const sentOrDone = queueJobs.filter(j => ["sent", "delivered", "failed", "skipped"].includes(j.status)).length;

  let correctedStatus = campaign.status;
  if (["scheduled", "running"].includes(campaign.status)) {
    if (pendingJobs === 0 && queueJobs.length > 0 && sentOrDone === queueJobs.length) {
      correctedStatus = "completed";
      await prisma.campaign.update({ where: { id }, data: { status: "completed", pending: 0 } });
    } else if (sentOrDone > 0 && campaign.status === "scheduled") {
      correctedStatus = "running";
      await prisma.campaign.update({ where: { id }, data: { status: "running" } });
    }
  }

  // Map queue status onto each recipient
  const queueByCustomer = Object.fromEntries(queueJobs.map((j) => [j.customerId, j]));
  const recipients = campaign.recipients.map((r) => ({
    ...r,
    queue: queueByCustomer[r.customerId] ?? null,
  }));

  return NextResponse.json({ ...campaign, status: correctedStatus, recipients });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const campaign = await prisma.campaign.update({ where: { id }, data: body });
  return NextResponse.json(campaign);
}
