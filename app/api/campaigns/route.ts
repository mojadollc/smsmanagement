import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const campaigns = await prisma.campaign.findMany({
    orderBy: { createdAt: "desc" },
  });
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
