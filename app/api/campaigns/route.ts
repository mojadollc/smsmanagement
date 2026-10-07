import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const campaigns = await prisma.campaign.findMany({
    orderBy: { createdAt: "desc" },
  });

  // Auto-correct any scheduled/running campaigns that are actually done
  const toCheck = campaigns.filter(c => ["scheduled", "running"].includes(c.status));
  if (toCheck.length > 0) {
    await Promise.all(toCheck.map(async (c) => {
      const [pendingJobs, doneJobs] = await Promise.all([
        prisma.smsQueue.count({ where: { campaignId: c.id, status: { in: ["pending", "sending"] } } }),
        prisma.smsQueue.count({ where: { campaignId: c.id, status: { in: ["sent", "delivered", "failed", "skipped"] } } }),
      ]);
      const total = await prisma.smsQueue.count({ where: { campaignId: c.id } });
      if (pendingJobs === 0 && total > 0 && doneJobs === total) {
        await prisma.campaign.update({ where: { id: c.id }, data: { status: "completed", pending: 0 } });
        c.status = "completed";
      } else if (doneJobs > 0 && c.status === "scheduled") {
        await prisma.campaign.update({ where: { id: c.id }, data: { status: "running" } });
        c.status = "running";
      }
    }));
  }

  return NextResponse.json(campaigns);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, message, customerIds, dailyLimit, schedules } = body;

  if (!name || !message || !customerIds?.length) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const campaign = await prisma.campaign.create({
    data: {
      name,
      message,
      dailyLimit: dailyLimit ?? 200,
      schedules,
      totalCount: customerIds.length,
      pending: customerIds.length,
      status: "draft",
      recipients: {
        create: customerIds.map((id: string) => ({ customerId: id })),
      },
    },
  });

  return NextResponse.json(campaign, { status: 201 });
}
