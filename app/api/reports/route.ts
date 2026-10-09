import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

/**
 * Returns the UTC Date that corresponds to midnight (00:00:00) of "today"
 * in the given IANA timezone.
 *
 * Strategy: take the current UTC time, format it as a date string in the
 * target timezone (gives us "YYYY-MM-DD"), then find the UTC instant that
 * equals midnight of that date in the timezone by probing with the offset.
 */
function getMidnightUTC(timezone: string): Date {
  const now = new Date();

  // Step 1: what is "today" in the target timezone?
  const localDateStr = now.toLocaleDateString("en-CA", { timeZone: timezone }); // "YYYY-MM-DD"

  // Step 2: construct a probe at noon UTC on that date — safely within the day
  const probeUTC = new Date(`${localDateStr}T12:00:00Z`);

  // Step 3: find the timezone offset at that probe time (local - UTC, in ms)
  const localAtProbe = new Date(probeUTC.toLocaleString("en-US", { timeZone: timezone }));
  const offsetMs = localAtProbe.getTime() - probeUTC.getTime();

  // Step 4: midnight UTC for that local date = midnight local - offset
  const midnightLocal = new Date(`${localDateStr}T00:00:00Z`); // treat as UTC for arithmetic
  return new Date(midnightLocal.getTime() - offsetMs);
}

export async function GET(req: NextRequest) {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const period = new URL(req.url).searchParams.get("period") ?? "day";

  try {
    const settingsRows = await prisma.$queryRaw<{ dailyLimit: number; timezone: string }[]>`
      SELECT "dailyLimit", "timezone" FROM "Settings" WHERE id = 'singleton' LIMIT 1
    `.catch(() => []);
    const settings = settingsRows[0];
    const timezone = settings?.timezone || "America/Vancouver";

    const todayUTC = getMidnightUTC(timezone);

    let periodStart: Date;
    if (period === "week") {
      periodStart = new Date(todayUTC);
      periodStart.setDate(periodStart.getDate() - 6);
    } else if (period === "month") {
      periodStart = new Date(todayUTC);
      periodStart.setDate(periodStart.getDate() - 29);
    } else {
      periodStart = todayUTC;
    }

    // Admins see ALL org conversations; agents see only their assigned ones
    const convWhere = user.role === "admin"
      ? { orgId: user.orgId }
      : { orgId: user.orgId, assignedUserId: user.id };

    const orgConvIds = await prisma.conversation.findMany({
      where: convWhere,
      select: { id: true },
    }).then(rows => rows.map(r => r.id));

    const sevenDaysAgo = new Date(todayUTC);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

    // Include all statuses that mean Twilio received the message
    const SENT_STATUSES   = ["queued", "accepted", "sending", "sent", "delivered", "failed", "undelivered"];
    const FAILED_STATUSES = ["failed", "undelivered"];

    const outBase      = { conversationId: { in: orgConvIds }, direction: "outbound" as const };
    const inBase       = { conversationId: { in: orgConvIds }, direction: "inbound"  as const };
    const outSent      = { ...outBase, status: { in: SENT_STATUSES } };
    const outDelivered = { ...outBase, status: "delivered" as const };
    const outFailed    = { ...outBase, status: { in: FAILED_STATUSES } };

    const [
      totalSent, totalDelivered, totalFailed,
      totalInbound, totalOptOuts, totalOptIns,
      totalCustomers, totalGroups, totalCampaigns,
      sentPeriod, deliveredPeriod, failedPeriod, inboundPeriod,
      activeCampaignsCount, unreadAgg,
      campaigns, last7DaysMsgs, last7DaysInbound,
    ] = await Promise.all([
      prisma.message.count({ where: outSent }),
      prisma.message.count({ where: outDelivered }),
      prisma.message.count({ where: outFailed }),
      prisma.message.count({ where: inBase }),
      prisma.customer.count({ where: { orgId: user.orgId, smsOptOut: true } }),
      prisma.customer.count({ where: { orgId: user.orgId, smsOptIn: true, smsOptOut: false } }),
      prisma.customer.count({ where: { orgId: user.orgId } }),
      prisma.group.count({ where: { orgId: user.orgId } }),
      prisma.campaign.count({ where: { orgId: user.orgId } }),
      prisma.message.count({ where: { ...outSent,      createdAt: { gte: periodStart } } }),
      prisma.message.count({ where: { ...outDelivered, createdAt: { gte: periodStart } } }),
      prisma.message.count({ where: { ...outFailed,    createdAt: { gte: periodStart } } }),
      prisma.message.count({ where: { ...inBase,       createdAt: { gte: periodStart } } }),
      prisma.campaign.count({ where: { orgId: user.orgId, status: { in: ["running", "scheduled"] } } }),
      prisma.conversation.aggregate({ where: convWhere, _sum: { unreadCount: true } }),
      prisma.campaign.findMany({
        where: { orgId: user.orgId },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: { id: true, name: true, totalCount: true, sent: true, delivered: true, failed: true, optedOut: true, status: true, createdAt: true },
      }),
      prisma.message.findMany({
        where: { ...outSent, createdAt: { gte: sevenDaysAgo } },
        select: { createdAt: true },
      }),
      prisma.message.findMany({
        where: { ...inBase, createdAt: { gte: sevenDaysAgo } },
        select: { createdAt: true },
      }),
    ]);

    // Build 7-day trend
    const dayCounts: Record<string, { sent: number; received: number }> = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date(todayUTC);
      d.setDate(d.getDate() - (6 - i));
      dayCounts[d.toISOString().slice(0, 10)] = { sent: 0, received: 0 };
    }
    for (const msg of last7DaysMsgs) {
      const key = new Date(msg.createdAt).toISOString().slice(0, 10);
      if (key in dayCounts) dayCounts[key].sent++;
    }
    for (const msg of last7DaysInbound) {
      const key = new Date(msg.createdAt).toISOString().slice(0, 10);
      if (key in dayCounts) dayCounts[key].received++;
    }
    const dailyTrend = Object.entries(dayCounts).map(([date, counts]) => ({ date, ...counts }));

    return NextResponse.json({
      totalSent, totalDelivered, totalFailed, totalInbound,
      totalOptOuts, totalOptIns, totalCustomers, totalGroups, totalCampaigns,
      sentToday: sentPeriod, deliveredToday: deliveredPeriod,
      failedPeriod, inboundPeriod,
      dailyLimit: settings?.dailyLimit ?? 200,
      activeCampaignsCount,
      unreadCount: unreadAgg._sum.unreadCount ?? 0,
      campaigns, dailyTrend, period,
    });
  } catch (e) {
    console.error("[reports]", e);
    return NextResponse.json({
      totalSent: 0, totalDelivered: 0, totalFailed: 0, totalInbound: 0,
      totalOptOuts: 0, totalOptIns: 0, totalCustomers: 0, totalGroups: 0, totalCampaigns: 0,
      sentToday: 0, deliveredToday: 0, failedPeriod: 0, inboundPeriod: 0,
      dailyLimit: 200, activeCampaignsCount: 0, unreadCount: 0, campaigns: [], dailyTrend: [],
    });
  }
}
