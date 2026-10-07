import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET() {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get conversation IDs for this org
    const orgConvIds = await prisma.conversation.findMany({
      where: { orgId: user.orgId },
      select: { id: true },
    }).then(rows => rows.map(r => r.id));

    const [totalSent, totalDelivered, totalFailed, totalOptOuts, sentToday, deliveredToday, campaigns, settingsRows] = await Promise.all([
      prisma.message.count({ where: { conversationId: { in: orgConvIds }, direction: "outbound" } }),
      prisma.message.count({ where: { conversationId: { in: orgConvIds }, direction: "outbound", status: "delivered" } }),
      prisma.message.count({ where: { conversationId: { in: orgConvIds }, direction: "outbound", status: { in: ["failed", "undelivered"] } } }),
      prisma.customer.count({ where: { orgId: user.orgId, smsOptOut: true } }),
      prisma.message.count({ where: { conversationId: { in: orgConvIds }, direction: "outbound", createdAt: { gte: today } } }),
      prisma.message.count({ where: { conversationId: { in: orgConvIds }, direction: "outbound", status: "delivered", createdAt: { gte: today } } }),
      prisma.campaign.findMany({
        where: { orgId: user.orgId },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: { id: true, name: true, totalCount: true, sent: true, delivered: true, failed: true, optedOut: true, status: true },
      }),
      prisma.$queryRaw<{ dailyLimit: number }[]>`SELECT "dailyLimit" FROM "Settings" WHERE id = 'singleton' LIMIT 1`.catch(() => []),
    ]);

    return NextResponse.json({ totalSent, totalDelivered, totalFailed, totalOptOuts, sentToday, deliveredToday, dailyLimit: settingsRows[0]?.dailyLimit ?? 200, campaigns });
  } catch {
    return NextResponse.json({ totalSent: 0, totalDelivered: 0, totalFailed: 0, totalOptOuts: 0, sentToday: 0, deliveredToday: 0, dailyLimit: 200, campaigns: [] });
  }
}
