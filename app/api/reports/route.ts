import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET() {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Agents see only their assigned conversations; admin sees all
    const convWhere = user.role === "admin"
      ? { orgId: user.orgId }
      : { orgId: user.orgId, assignedUserId: user.id };

    const orgConvIds = await prisma.conversation.findMany({
      where: convWhere,
      select: { id: true },
    }).then(rows => rows.map(r => r.id));

    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

    const [totalSent, totalDelivered, totalFailed, totalOptOuts, sentToday, deliveredToday, campaigns, settingsRows, last7DaysMsgs] = await Promise.all([
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
      prisma.message.findMany({
        where: { conversationId: { in: orgConvIds }, direction: "outbound", createdAt: { gte: sevenDaysAgo } },
        select: { createdAt: true },
      }),
    ]);

    // Build real 7-day counts
    const dayCounts: Record<string, number> = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - (6 - i));
      dayCounts[d.toISOString().slice(0, 10)] = 0;
    }
    for (const msg of last7DaysMsgs) {
      const key = new Date(msg.createdAt).toISOString().slice(0, 10);
      if (key in dayCounts) dayCounts[key]++;
    }
    const dailyTrend = Object.entries(dayCounts).map(([date, sent]) => ({ date, sent }));

    return NextResponse.json({ totalSent, totalDelivered, totalFailed, totalOptOuts, sentToday, deliveredToday, dailyLimit: settingsRows[0]?.dailyLimit ?? 200, campaigns, dailyTrend });
  } catch {
    return NextResponse.json({ totalSent: 0, totalDelivered: 0, totalFailed: 0, totalOptOuts: 0, sentToday: 0, deliveredToday: 0, dailyLimit: 200, campaigns: [] });
  }
}
