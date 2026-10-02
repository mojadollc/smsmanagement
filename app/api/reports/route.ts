import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [sentToday, deliveredToday, failedToday, inboxUnread, recentConversations] =
    await Promise.all([
      prisma.message.count({
        where: { direction: "outbound", createdAt: { gte: today } },
      }),
      prisma.message.count({
        where: { direction: "outbound", status: "delivered", createdAt: { gte: today } },
      }),
      prisma.message.count({
        where: {
          direction: "outbound",
          status: { in: ["failed", "undelivered"] },
          createdAt: { gte: today },
        },
      }),
      prisma.conversation.aggregate({ _sum: { unreadCount: true } }),
      prisma.conversation.findMany({
        take: 5,
        orderBy: { lastMessageAt: "desc" },
        include: {
          customer: true,
          messages: { orderBy: { createdAt: "desc" }, take: 1 },
        },
      }),
    ]);

  return NextResponse.json({
    sentToday,
    deliveredToday,
    failedToday,
    inboxUnread: inboxUnread._sum.unreadCount ?? 0,
    recentConversations,
  });
}
