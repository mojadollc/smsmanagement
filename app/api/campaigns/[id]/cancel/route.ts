import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.campaign.update({ where: { id }, data: { status: "cancelled" } });
  await prisma.smsQueue.updateMany({
    where: { campaignId: id, status: { in: ["pending", "paused"] } },
    data: { status: "cancelled" },
  });
  return NextResponse.json({ success: true });
}
