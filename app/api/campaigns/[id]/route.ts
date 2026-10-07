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

  // Map queue status onto each recipient
  const queueByCustomer = Object.fromEntries(queueJobs.map((j) => [j.customerId, j]));
  const recipients = campaign.recipients.map((r) => ({
    ...r,
    queue: queueByCustomer[r.customerId] ?? null,
  }));

  return NextResponse.json({ ...campaign, recipients });
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
