import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

export const dynamic = "force-dynamic";

async function getStats() {
  try {
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
          take: 5,
        }),
      ]);
    return { sentToday, deliveredToday, failedToday, inboxUnread: inboxUnread._sum.unreadCount ?? 0, recentConversations, activeCampaigns };
  } catch {
    return null;
  }
}

export default async function DashboardPage() {
  const stats = await getStats();
  const settingsData = await prisma.settings.findUnique({ where: { id: "singleton" } }).catch(() => null);
  const dailyLimit = settingsData?.dailyLimit ?? 200;

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-gray-500 mb-2">Database not connected.</p>
          <p className="text-sm text-gray-400">Check your DATABASE_URL in Settings.</p>
        </div>
      </div>
    );
  }

  const pct = Math.min(100, Math.round((stats.sentToday / dailyLimit) * 100));

  const statCards = [
    { label: "Sent Today", value: stats.sentToday, color: "text-gray-900", bg: "bg-white" },
    { label: "Delivered", value: stats.deliveredToday, color: "text-green-600", bg: "bg-white" },
    { label: "Failed", value: stats.failedToday, color: "text-red-600", bg: "bg-white" },
    { label: "Unread Inbox", value: stats.inboxUnread, color: "text-blue-600", bg: "bg-white" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">Welcome back. Here&apos;s what&apos;s happening today.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-4">
        {statCards.map((s) => (
          <div key={s.label} className={`${s.bg} rounded-xl border border-gray-200 p-5`}>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{s.label}</p>
            <p className={`text-3xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Daily limit */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex justify-between items-center mb-3">
          <div>
            <p className="font-semibold text-gray-900">Daily SMS Limit</p>
            <p className="text-sm text-gray-500">{stats.sentToday} sent · {dailyLimit - stats.sentToday} remaining</p>
          </div>
          <span className="text-2xl font-bold text-gray-900">{pct}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2.5">
          <div
            className={`h-2.5 rounded-full transition-all ${pct > 90 ? "bg-red-500" : pct > 70 ? "bg-yellow-500" : "bg-blue-600"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Active campaigns */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-gray-900">Active Campaigns</h2>
            <Link href="/dashboard/campaigns" className="text-xs text-blue-600 hover:underline">View all →</Link>
          </div>
          {stats.activeCampaigns.length === 0 ? (
            <p className="text-sm text-gray-400">No active campaigns</p>
          ) : (
            <div className="space-y-3">
              {stats.activeCampaigns.map((c) => (
                <div key={c.id} className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{c.name}</p>
                    <p className="text-xs text-gray-400">{c.sent} / {c.totalCount} sent</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${c.status === "running" ? "bg-yellow-100 text-yellow-700" : "bg-blue-100 text-blue-700"}`}>
                    {c.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent conversations */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-gray-900">Recent Conversations</h2>
            <Link href="/dashboard/inbox" className="text-xs text-blue-600 hover:underline">View all →</Link>
          </div>
          {stats.recentConversations.length === 0 ? (
            <p className="text-sm text-gray-400">No conversations yet</p>
          ) : (
            <div className="space-y-3">
              {stats.recentConversations.map((conv) => (
                <div key={conv.id} className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{conv.customer.firstName} {conv.customer.lastName}</p>
                    <p className="text-xs text-gray-400 truncate max-w-[200px]">{conv.messages[0]?.body ?? "No messages"}</p>
                  </div>
                  <span className="text-xs text-gray-400 whitespace-nowrap">
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
