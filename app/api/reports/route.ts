import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalSent,
      totalDelivered,
      totalFailed,
      totalOptOuts,
      sentToday,
      deliveredToday,
      campaigns,
      settingsRows,
    ] = await Promise.all([
      prisma.message.count({ where: { direction: "outbound" } }),
      prisma.message.count({ where: { direction: "outbound", status: "delivered" } }),
      prisma.message.count({ where: { direction: "outbound", status: { in: ["failed", "undelivered"] } } }),
      prisma.customer.count({ where: { smsOptOut: true } }),
      prisma.message.count({ where: { direction: "outbound", createdAt: { gte: today } } }),
      prisma.message.count({ where: { direction: "outbound", status: "delivered", createdAt: { gte: today } } }),
      prisma.campaign.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          name: true,
          totalCount: true,
          sent: true,
          delivered: true,
          failed: true,
          optedOut: true,
          status: true,
        },
      }),
      prisma.$queryRaw<{ dailyLimit: number }[]>`SELECT "dailyLimit" FROM "Settings" WHERE id = 'singleton' LIMIT 1`.catch(() => []),
    ]);

    return NextResponse.json({
      totalSent,
      totalDelivered,
      totalFailed,
      totalOptOuts,
      sentToday,
      deliveredToday,
      dailyLimit: settingsRows[0]?.dailyLimit ?? 200,
      campaigns,
    });
  } catch {
    return NextResponse.json({
      totalSent: 0,
      totalDelivered: 0,
      totalFailed: 0,
      totalOptOuts: 0,
      sentToday: 0,
      deliveredToday: 0,
      dailyLimit: 200,
      campaigns: [],
    });
  }
}
