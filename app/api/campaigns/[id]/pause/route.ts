import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.campaign.update({ where: { id }, data: { status: "paused" } });
  await prisma.smsQueue.updateMany({
    where: { campaignId: id, status: "pending" },
    data: { status: "paused" },
  });
  return NextResponse.json({ success: true });
}
