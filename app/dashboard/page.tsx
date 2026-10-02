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

const statusColors: Record<string, { bg: string; text: string }> = {
  running:   { bg: "rgba(234,179,8,0.12)",  text: "#ca8a04" },
  scheduled: { bg: "rgba(59,130,246,0.12)", text: "#2563eb" },
  completed: { bg: "rgba(34,197,94,0.12)",  text: "#16a34a" },
  paused:    { bg: "rgba(148,163,184,0.12)", text: "#64748b" },
  cancelled: { bg: "rgba(239,68,68,0.12)",  text: "#dc2626" },
};

export default async function DashboardPage() {
  const stats = await getStats();
  const settingsData = await prisma.settings.findUnique({ where: { id: "singleton" } }).catch(() => null);
  const dailyLimit = settingsData?.dailyLimit ?? 200;

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p style={{ color: "var(--text-2)" }} className="mb-1">Database not connected.</p>
          <p className="text-sm" style={{ color: "var(--text-3)" }}>Check your DATABASE_URL in Settings.</p>
        </div>
      </div>
    );
  }

  const pct = Math.min(100, Math.round((stats.sentToday / dailyLimit) * 100));
  const barColor = pct > 90 ? "#ef4444" : pct > 70 ? "#f59e0b" : "#3b82f6";

  const statCards = [
    {
      label: "Sent Today",
      value: stats.sentToday,
      iconBg: "rgba(59,130,246,0.12)",
      iconColor: "#3b82f6",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
        </svg>
      ),
    },
    {
      label: "Delivered",
      value: stats.deliveredToday,
      iconBg: "rgba(34,197,94,0.12)",
      iconColor: "#16a34a",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: "Failed",
      value: stats.failedToday,
      iconBg: "rgba(239,68,68,0.12)",
      iconColor: "#dc2626",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: "Unread Inbox",
      value: stats.inboxUnread,
      iconBg: "rgba(168,85,247,0.12)",
      iconColor: "#9333ea",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>Dashboard</h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--text-2)" }}>Welcome back. Here&apos;s what&apos;s happening today.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-4">
        {statCards.map((s) => (
          <div key={s.label} className="card p-5" style={{ background: "var(--bg-card)" }}>
            <div className="flex items-start justify-between mb-3">
              <p className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--text-3)" }}>{s.label}</p>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: s.iconBg, color: s.iconColor }}>
                {s.icon}
              </div>
            </div>
            <p className="text-3xl font-bold" style={{ color: "var(--text)" }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Daily limit bar */}
      <div className="card p-5" style={{ background: "var(--bg-card)" }}>
        <div className="flex justify-between items-start mb-3">
          <div>
            <p className="font-semibold" style={{ color: "var(--text)" }}>Daily SMS Limit</p>
            <p className="text-sm mt-0.5" style={{ color: "var(--text-2)" }}>
              {stats.sentToday} sent · {dailyLimit - stats.sentToday} remaining of {dailyLimit}
            </p>
          </div>
          <span className="text-2xl font-bold" style={{ color: "var(--text)" }}>{pct}%</span>
        </div>
        <div className="w-full rounded-full h-2" style={{ background: "var(--bg-subtle)" }}>
          <div
            className="h-2 rounded-full transition-all"
            style={{ width: `${pct}%`, background: barColor }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Active campaigns */}
        <div className="card p-5" style={{ background: "var(--bg-card)" }}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold" style={{ color: "var(--text)" }}>Active Campaigns</h2>
            <Link href="/dashboard/campaigns" className="text-xs font-medium" style={{ color: "var(--accent)" }}>
              View all →
            </Link>
          </div>
          {stats.activeCampaigns.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <div className="w-10 h-10 rounded-full flex items-center justify-center mb-2" style={{ background: "var(--bg-subtle)" }}>
                <svg className="w-5 h-5" style={{ color: "var(--text-3)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                </svg>
              </div>
              <p className="text-sm" style={{ color: "var(--text-3)" }}>No active campaigns</p>
            </div>
          ) : (
            <div className="space-y-3">
              {stats.activeCampaigns.map((c) => {
                const sc = statusColors[c.status] ?? statusColors.paused;
                return (
                  <div key={c.id} className="flex justify-between items-center">
                    <div className="min-w-0 mr-3">
                      <p className="text-sm font-medium truncate" style={{ color: "var(--text)" }}>{c.name}</p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>{c.sent} / {c.totalCount} sent</p>
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded-full font-medium shrink-0" style={{ background: sc.bg, color: sc.text }}>
                      {c.status}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent conversations */}
        <div className="card p-5" style={{ background: "var(--bg-card)" }}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold" style={{ color: "var(--text)" }}>Recent Conversations</h2>
            <Link href="/dashboard/inbox" className="text-xs font-medium" style={{ color: "var(--accent)" }}>
              View all →
            </Link>
          </div>
          {stats.recentConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <div className="w-10 h-10 rounded-full flex items-center justify-center mb-2" style={{ background: "var(--bg-subtle)" }}>
                <svg className="w-5 h-5" style={{ color: "var(--text-3)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <p className="text-sm" style={{ color: "var(--text-3)" }}>No conversations yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {stats.recentConversations.map((conv) => (
                <Link key={conv.id} href={`/dashboard/inbox`} className="flex justify-between items-start group">
                  <div className="min-w-0 mr-3">
                    <p className="text-sm font-medium" style={{ color: "var(--text)" }}>
                      {conv.customer.firstName} {conv.customer.lastName}
                    </p>
                    <p className="text-xs mt-0.5 truncate max-w-[180px]" style={{ color: "var(--text-3)" }}>
                      {conv.messages[0]?.body ?? "No messages"}
                    </p>
                  </div>
                  <span className="text-xs whitespace-nowrap shrink-0" style={{ color: "var(--text-3)" }}>
                    {conv.lastMessageAt ? formatDistanceToNow(new Date(conv.lastMessageAt), { addSuffix: true }) : ""}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
