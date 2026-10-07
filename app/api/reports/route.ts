import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

function getUSTimezoneOffset() {
  // Use Eastern as the reference — covers most US business hours
  // Returns the UTC start-of-day for "today" in US/Eastern
  const now = new Date();
  const usNow = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
  const todayUS = new Date(usNow);
  todayUS.setHours(0, 0, 0, 0);
  const offset = now.getTime() - usNow.getTime();
  return new Date(todayUS.getTime() + offset);
}

export async function GET(req: NextRequest) {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const period = new URL(req.url).searchParams.get("period") ?? "day"; // day | week | month

  try {
    const todayUTC = getUSTimezoneOffset();

    let periodStart: Date;
    if (period === "week") {
      periodStart = new Date(todayUTC);
      periodStart.setDate(periodStart.getDate() - 6);
    } else if (period === "month") {
      periodStart = new Date(todayUTC);
      periodStart.setDate(periodStart.getDate() - 29);
    } else {
      periodStart = todayUTC; // today only
    }

    // Agents see only their assigned conversations; admin sees all
    const convWhere = user.role === "admin"
      ? { orgId: user.orgId }
      : { orgId: user.orgId, assignedUserId: user.id };

    const orgConvIds = await prisma.conversation.findMany({
      where: convWhere,
      select: { id: true },
    }).then(rows => rows.map(r => r.id));

    // 7-day window for trend chart (always 7 days regardless of period filter)
    const sevenDaysAgo = new Date(todayUTC);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

    const msgWhere = { conversationId: { in: orgConvIds }, direction: "outbound" as const };
    const periodWhere = { ...msgWhere, createdAt: { gte: periodStart } };

    const [totalSent, totalDelivered, totalFailed, totalOptOuts, sentPeriod, deliveredPeriod, failedPeriod, campaigns, settingsRows, last7DaysMsgs] = await Promise.all([
      prisma.message.count({ where: msgWhere }),
      prisma.message.count({ where: { ...msgWhere, status: "delivered" } }),
      prisma.message.count({ where: { ...msgWhere, status: { in: ["failed", "undelivered"] } } }),
      prisma.customer.count({ where: { orgId: user.orgId, smsOptOut: true } }),
      prisma.message.count({ where: periodWhere }),
      prisma.message.count({ where: { ...periodWhere, status: "delivered" } }),
      prisma.message.count({ where: { ...periodWhere, status: { in: ["failed", "undelivered"] } } }),
      prisma.campaign.findMany({
        where: { orgId: user.orgId },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: { id: true, name: true, totalCount: true, sent: true, delivered: true, failed: true, optedOut: true, status: true },
      }),
      prisma.$queryRaw<{ dailyLimit: number }[]>`SELECT "dailyLimit" FROM "Settings" WHERE id = 'singleton' LIMIT 1`.catch(() => []),
      prisma.message.findMany({
        where: { ...msgWhere, createdAt: { gte: sevenDaysAgo } },
        select: { createdAt: true },
      }),
    ]);

    // Build 7-day trend
    const dayCounts: Record<string, number> = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date(todayUTC);
      d.setDate(d.getDate() - (6 - i));
      dayCounts[d.toISOString().slice(0, 10)] = 0;
    }
    for (const msg of last7DaysMsgs) {
      const key = new Date(msg.createdAt).toISOString().slice(0, 10);
      if (key in dayCounts) dayCounts[key]++;
    }
    const dailyTrend = Object.entries(dayCounts).map(([date, sent]) => ({ date, sent }));

    return NextResponse.json({
      totalSent, totalDelivered, totalFailed, totalOptOuts,
      sentToday: sentPeriod, deliveredToday: deliveredPeriod, failedPeriod,
      dailyLimit: settingsRows[0]?.dailyLimit ?? 200,
      campaigns, dailyTrend, period,
    });
  } catch {
    return NextResponse.json({ totalSent: 0, totalDelivered: 0, totalFailed: 0, totalOptOuts: 0, sentToday: 0, deliveredToday: 0, failedPeriod: 0, dailyLimit: 200, campaigns: [], dailyTrend: [] });
  }
}
