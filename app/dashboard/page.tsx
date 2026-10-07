"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

interface Stats {
  sentToday: number;
  deliveredToday: number;
  failedToday: number;
  totalSent: number;
  totalDelivered: number;
  totalFailed: number;
  inboxUnread: number;
  dailyLimit: number;
  activeCampaigns: {
    id: string;
    name: string;
    status: string;
    sent: number;
    totalCount: number;
  }[];
  recentConversations: {
    id: string;
    lastMessageAt: string | null;
    customer: { firstName: string; lastName: string };
    messages: { body: string }[];
  }[];
}

const statusColors: Record<string, { bg: string; text: string }> = {
  running:   { bg: "rgba(234,179,8,0.12)",   text: "#ca8a04" },
  scheduled: { bg: "rgba(59,130,246,0.12)",  text: "#2563eb" },
  completed: { bg: "rgba(34,197,94,0.12)",   text: "#16a34a" },
  paused:    { bg: "rgba(148,163,184,0.12)", text: "#64748b" },
  cancelled: { bg: "rgba(239,68,68,0.12)",   text: "#dc2626" },
};

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      fetch("/api/reports").then((r) => r.ok ? r.json() : null),
      fetch("/api/conversations?limit=5").then((r) => r.ok ? r.json() : null),
      fetch("/api/auth/me").then((r) => r.ok ? r.json() : null),
    ]).then(([reports, convos, me]) => {
      if (mounted && reports) {
        setStats({
          ...reports,
          failedToday: reports.totalFailed ?? 0,
          inboxUnread: convos?.conversations?.reduce((a: number, c: any) => a + (c.unreadCount ?? 0), 0) ?? 0,
          activeCampaigns: (reports.campaigns ?? []).filter((c: any) =>
            ["running", "scheduled", "paused"].includes(c.status)
          ),
          recentConversations: convos?.conversations ?? [],
        });
      }
    }).catch(() => {});
    return () => { mounted = false; };
  }, []);

  if (!stats) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>Dashboard</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-2)" }}>Welcome back. Here&apos;s what&apos;s happening today.</p>
        </div>
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card p-5 animate-pulse" style={{ background: "var(--bg-card)" }}>
              <div className="h-3 w-20 rounded mb-4" style={{ background: "var(--bg-subtle)" }} />
              <div className="h-8 w-12 rounded" style={{ background: "var(--bg-subtle)" }} />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="card p-5 animate-pulse h-48" style={{ background: "var(--bg-card)" }}>
              <div className="h-3 w-32 rounded" style={{ background: "var(--bg-subtle)" }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const pct = Math.min(100, Math.round((stats.sentToday / stats.dailyLimit) * 100));
  const barColor = pct > 90 ? "#ef4444" : pct > 70 ? "#f59e0b" : "#3b82f6";

  const statCards = [
    { label: "Total Sent",    value: stats.totalSent,      iconBg: "rgba(59,130,246,0.12)",  iconColor: "#3b82f6",
      icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg> },
    { label: "Total Delivered",     value: stats.totalDelivered, iconBg: "rgba(34,197,94,0.12)",   iconColor: "#16a34a",
      icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
    { label: "Total Failed",        value: stats.totalFailed,    iconBg: "rgba(239,68,68,0.12)",   iconColor: "#dc2626",
      icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
    { label: "Unread Inbox",  value: stats.inboxUnread,    iconBg: "rgba(168,85,247,0.12)",  iconColor: "#9333ea",
      icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg> },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>Dashboard</h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--text-2)" }}>Welcome back. Here&apos;s what&apos;s happening today.</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {statCards.map((s) => (
          <div key={s.label} className="card p-5" style={{ background: "var(--bg-card)" }}>
            <div className="flex items-start justify-between mb-3">
              <p className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--text-3)" }}>{s.label}</p>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: s.iconBg, color: s.iconColor }}>{s.icon}</div>
            </div>
            <p className="text-3xl font-bold" style={{ color: "var(--text)" }}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="card p-5" style={{ background: "var(--bg-card)" }}>
        <div className="flex justify-between items-start mb-3">
          <div>
            <p className="font-semibold" style={{ color: "var(--text)" }}>Daily SMS Limit</p>
            <p className="text-sm mt-0.5" style={{ color: "var(--text-2)" }}>
              {stats.sentToday} sent · {stats.dailyLimit - stats.sentToday} remaining of {stats.dailyLimit}
            </p>
          </div>
          <span className="text-2xl font-bold" style={{ color: "var(--text)" }}>{pct}%</span>
        </div>
        <div className="w-full rounded-full h-2" style={{ background: "var(--bg-subtle)" }}>
          <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, background: barColor }} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="card p-5" style={{ background: "var(--bg-card)" }}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold" style={{ color: "var(--text)" }}>Active Campaigns</h2>
            <Link href="/dashboard/campaigns" className="text-xs font-medium" style={{ color: "var(--accent)" }}>View all →</Link>
          </div>
          {(stats.activeCampaigns ?? []).length === 0 ? (
            <p className="text-sm py-6 text-center" style={{ color: "var(--text-3)" }}>No active campaigns</p>
          ) : (
            <div className="space-y-3">
              {(stats.activeCampaigns ?? []).map((c) => {
                const sc = statusColors[c.status] ?? statusColors.paused;
                return (
                  <div key={c.id} className="flex justify-between items-center">
                    <div className="min-w-0 mr-3">
                      <p className="text-sm font-medium truncate" style={{ color: "var(--text)" }}>{c.name}</p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>{c.sent} / {c.totalCount} sent</p>
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded-full font-medium shrink-0" style={{ background: sc.bg, color: sc.text }}>{c.status}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="card p-5" style={{ background: "var(--bg-card)" }}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold" style={{ color: "var(--text)" }}>Recent Conversations</h2>
            <Link href="/dashboard/inbox" className="text-xs font-medium" style={{ color: "var(--accent)" }}>View all →</Link>
          </div>
          {(stats.recentConversations ?? []).length === 0 ? (
            <p className="text-sm py-6 text-center" style={{ color: "var(--text-3)" }}>No conversations yet</p>
          ) : (
            <div className="space-y-3">
              {(stats.recentConversations ?? []).map((conv) => (
                <Link key={conv.id} href="/dashboard/inbox" className="flex justify-between items-start group">
                  <div className="min-w-0 mr-3">
                    <p className="text-sm font-medium" style={{ color: "var(--text)" }}>{conv.customer.firstName} {conv.customer.lastName}</p>
                    <p className="text-xs mt-0.5 truncate max-w-[180px]" style={{ color: "var(--text-3)" }}>{conv.messages[0]?.body ?? "No messages"}</p>
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
