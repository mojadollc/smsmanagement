import { prisma } from "@/lib/prisma";
import StatCard from "@/components/dashboard/StatCard";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [sentToday, deliveredToday, failedToday, inboxUnread, recentConversations, activeCampaigns] =
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
      }),
    ]);

  const dailyLimit = 200;
  const pct = Math.min(100, Math.round((sentToday / dailyLimit) * 100));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">SMS Dashboard</h1>

      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Sent Today" value={sentToday} />
        <StatCard label="Delivered" value={deliveredToday} color="text-green-600" />
        <StatCard label="Failed" value={failedToday} color="text-red-600" />
        <StatCard label="Inbox" value={inboxUnread._sum.unreadCount ?? 0} color="text-blue-600" />
      </div>

      {/* Daily limit bar */}
      <div className="bg-white border rounded-lg p-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="font-medium">Today&apos;s SMS Limit</span>
          <span className="text-gray-500">{sentToday} / {dailyLimit}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div className="bg-blue-600 h-3 rounded-full transition-all" style={{ width: `${pct}%` }} />
        </div>
        <p className="text-xs text-gray-400 mt-1">Remaining: {dailyLimit - sentToday}</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Active campaigns */}
        <div className="bg-white border rounded-lg p-4">
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-semibold text-sm">Active Campaigns</h2>
            <Link href="/dashboard/campaigns" className="text-xs text-blue-600">View all</Link>
          </div>
          {activeCampaigns.length === 0 ? (
            <p className="text-sm text-gray-400">No active campaigns</p>
          ) : (
            <div className="space-y-2">
              {activeCampaigns.map((c) => (
                <div key={c.id} className="flex justify-between items-center text-sm">
                  <span>{c.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">{c.sent}/{c.totalCount}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${c.status === "running" ? "bg-yellow-100 text-yellow-700" : "bg-blue-100 text-blue-700"}`}>
                      {c.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent conversations */}
        <div className="bg-white border rounded-lg p-4">
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-semibold text-sm">Recent Conversations</h2>
            <Link href="/dashboard/inbox" className="text-xs text-blue-600">View all</Link>
          </div>
          {recentConversations.length === 0 ? (
            <p className="text-sm text-gray-400">No conversations yet</p>
          ) : (
            <div className="space-y-2">
              {recentConversations.map((conv) => (
                <div key={conv.id} className="flex justify-between items-center text-sm">
                  <div>
                    <span className="font-medium">{conv.customer.firstName} {conv.customer.lastName}</span>
                    <p className="text-xs text-gray-400 truncate max-w-[180px]">{conv.messages[0]?.body}</p>
                  </div>
                  <span className="text-xs text-gray-400">
                    {conv.lastMessageAt ? formatDistanceToNow(new Date(conv.lastMessageAt), { addSuffix: true }) : ""}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
