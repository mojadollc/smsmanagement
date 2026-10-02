import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [sentToday, deliveredToday, failedToday, inboxUnread, recentConversations, activeCampaigns, settingsRows] =
      await Promise.all([
        prisma.message.count({ where: { direction: "outbound", createdAt: { gte: today } } }),
        prisma.message.count({ where: { direction: "outbound", status: "delivered", createdAt: { gte: today } } }),
        prisma.message.count({ where: { direction: "outbound", status: { in: ["failed", "undelivered"] }, createdAt: { gte: today } } }),
        prisma.conversation.aggregate({ _sum: { unreadCount: true } }),
        prisma.conversation.findMany({
          take: 5,
          orderBy: { lastMessageAt: "desc" },
          include: { customer: true, messages: { orderBy: { createdAt: "desc" }, take: 1 } },
        }),
        prisma.campaign.findMany({
          where: { status: { in: ["scheduled", "running"] } },
          orderBy: { createdAt: "desc" },
          take: 5,
        }),
        prisma.$queryRaw<{ dailyLimit: number }[]>`SELECT "dailyLimit" FROM "Settings" WHERE id = 'singleton' LIMIT 1`.catch(() => []),
      ]);

    return NextResponse.json({
      sentToday,
      deliveredToday,
      failedToday,
      inboxUnread: inboxUnread._sum.unreadCount ?? 0,
      recentConversations,
      activeCampaigns,
      dailyLimit: settingsRows[0]?.dailyLimit ?? 200,
    });
  } catch {
    return NextResponse.json({ sentToday: 0, deliveredToday: 0, failedToday: 0, inboxUnread: 0, recentConversations: [], activeCampaigns: [], dailyLimit: 200 });
  }
}
