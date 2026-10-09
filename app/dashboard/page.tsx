"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

interface Stats {
  totalSent: number;
  totalDelivered: number;
  totalFailed: number;
  totalInbound: number;
  totalOptOuts: number;
  totalCustomers: number;
  totalCampaigns: number;
  sentToday: number;
  deliveredToday: number;
  failedPeriod: number;
  inboundPeriod: number;
  dailyLimit: number;
  activeCampaignsCount: number;
  unreadCount: number;
  campaigns: { id: string; name: string; status: string; sent: number; totalCount: number; delivered: number; failed: number }[];
  recentConversations: {
    id: string;
    lastMessageAt: string | null;
    unreadCount: number;
    customer: { firstName: string; lastName: string };
    messages: { body: string; direction: string }[];
  }[];
  balance: string | null;
  currency: string | null;
}

const STATUS_STYLE: Record<string, { bg: string; text: string }> = {
  running:   { bg: "rgba(234,179,8,0.12)",   text: "#ca8a04" },
  scheduled: { bg: "rgba(59,130,246,0.12)",  text: "#2563eb" },
  completed: { bg: "rgba(34,197,94,0.12)",   text: "#16a34a" },
  paused:    { bg: "rgba(148,163,184,0.12)", text: "#64748b" },
  cancelled: { bg: "rgba(239,68,68,0.12)",   text: "#dc2626" },
  draft:     { bg: "rgba(148,163,184,0.12)", text: "#64748b" },
};

function MiniBar({ value, total, color }: { value: number; total: number; color: string }) {
  const pct = total > 0 ? Math.min(100, (value / total) * 100) : 0;
  return (
    <div className="w-full h-1.5 rounded-full mt-2" style={{ background: "var(--bg-subtle)" }}>
      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      fetch("/api/reports").then(r => r.ok ? r.json() : null),
      fetch("/api/conversations?limit=6").then(r => r.ok ? r.json() : null),
      fetch("/api/twilio/balance").then(r => r.ok ? r.json() : null),
    ]).then(([reports, convos, bal]) => {
      if (!mounted || !reports) return;
      setStats({
        ...reports,
        recentConversations: convos?.conversations ?? [],
        balance: bal?.balance ?? null,
        currency: bal?.currency ?? null,
      });
      setLoading(false);
    }).catch(() => setLoading(false));
    return () => { mounted = false; };
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="h-7 w-40 rounded-lg animate-pulse mb-1" style={{ background: "var(--bg-subtle)" }} />
          <div className="h-4 w-64 rounded animate-pulse" style={{ background: "var(--bg-subtle)" }} />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map(i => (
            <div key={i} className="card p-5 animate-pulse h-28" style={{ background: "var(--bg-card)" }} />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {[...Array(3)].map(i => (
            <div key={i} className="card p-5 animate-pulse h-24" style={{ background: "var(--bg-card)" }} />
          ))}
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const deliveryRate = stats.totalSent > 0 ? Math.round((stats.totalDelivered / stats.totalSent) * 100) : 0;
  const limitPct = Math.min(100, stats.dailyLimit > 0 ? Math.round((stats.sentToday / stats.dailyLimit) * 100) : 0);
  const limitColor = limitPct >= 90 ? "#ef4444" : limitPct >= 70 ? "#f59e0b" : "#3b82f6";

  const topCards = [
    {
      label: "Sent Today", value: stats.sentToday, sub: `${stats.deliveredToday} delivered`,
      color: "#3b82f6", bg: "rgba(59,130,246,0.1)",
      icon: <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />,
      href: "/dashboard/reports",
    },
    {
      label: "Delivery Rate", value: `${deliveryRate}%`, sub: `${stats.totalDelivered.toLocaleString()} of ${stats.totalSent.toLocaleString()}`,
      color: "#22c55e", bg: "rgba(34,197,94,0.1)",
      icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
      href: "/dashboard/reports",
    },
    {
      label: "Unread Messages", value: stats.unreadCount, sub: `${stats.inboundPeriod} received today`,
      color: "#8b5cf6", bg: "rgba(139,92,246,0.1)",
      icon: <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />,
      href: "/dashboard/inbox",
    },
    {
      label: "Active Campaigns", value: stats.activeCampaignsCount, sub: `${stats.totalCampaigns} total campaigns`,
      color: "#f59e0b", bg: "rgba(245,158,11,0.1)",
      icon: <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />,
      href: "/dashboard/campaigns",
    },
  ];

  const secondRow = [
    { label: "Total Customers", value: stats.totalCustomers.toLocaleString(), color: "#06b6d4", bg: "rgba(6,182,212,0.1)", href: "/dashboard/customers",
      icon: <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /> },
    { label: "Opt-Outs", value: stats.totalOptOuts.toLocaleString(), color: "#ef4444", bg: "rgba(239,68,68,0.1)", href: "/dashboard/customers",
      icon: <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /> },
    { label: "Twilio Balance", value: stats.balance != null ? `${stats.currency ?? "USD"} $${parseFloat(stats.balance).toFixed(2)}` : "—", color: "#10b981", bg: "rgba(16,185,129,0.1)", href: "/dashboard/phone-numbers",
      icon: <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" /> },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>Dashboard</h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--text-2)" }}>Welcome back. Here&apos;s what&apos;s happening today.</p>
      </div>

      {/* Top stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {topCards.map(s => (
          <Link key={s.label} href={s.href} className="card p-5 block hover:scale-[1.01] transition-transform" style={{ background: "var(--bg-card)" }}>
            <div className="flex items-start justify-between mb-2">
              <p className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--text-3)" }}>{s.label}</p>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: s.bg }}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke={s.color} strokeWidth={2}>{s.icon}</svg>
              </div>
            </div>
            <p className="text-3xl font-bold" style={{ color: "var(--text)" }}>{typeof s.value === "number" ? s.value.toLocaleString() : s.value}</p>
            <p className="text-xs mt-1" style={{ color: "var(--text-3)" }}>{s.sub}</p>
          </Link>
        ))}
      </div>

      {/* Second row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {secondRow.map(s => (
          <Link key={s.label} href={s.href} className="card p-5 flex items-center gap-4 hover:scale-[1.01] transition-transform" style={{ background: "var(--bg-card)" }}>
            <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: s.bg }}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke={s.color} strokeWidth={1.8}>{s.icon}</svg>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide mb-0.5" style={{ color: "var(--text-3)" }}>{s.label}</p>
              <p className="text-xl font-bold" style={{ color: "var(--text)" }}>{s.value}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Daily limit bar */}
      <div className="card p-5" style={{ background: "var(--bg-card)" }}>
        <div className="flex justify-between items-center mb-2">
          <div>
            <p className="font-semibold" style={{ color: "var(--text)" }}>Daily SMS Limit</p>
            <p className="text-sm mt-0.5" style={{ color: "var(--text-2)" }}>
              {stats.sentToday.toLocaleString()} sent · {Math.max(0, stats.dailyLimit - stats.sentToday).toLocaleString()} remaining of {stats.dailyLimit.toLocaleString()}
            </p>
          </div>
          <span className="text-2xl font-bold" style={{ color: limitColor }}>{limitPct}%</span>
        </div>
        <div className="w-full rounded-full h-2.5" style={{ background: "var(--bg-subtle)" }}>
          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${limitPct}%`, background: limitColor }} />
        </div>
        {limitPct >= 90 && (
          <p className="text-xs mt-2 font-medium" style={{ color: "#ef4444" }}>⚠ Approaching daily limit</p>
        )}
      </div>

      {/* Campaigns + Conversations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-5" style={{ background: "var(--bg-card)" }}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold" style={{ color: "var(--text)" }}>Active Campaigns</h2>
            <Link href="/dashboard/campaigns" className="text-xs font-medium" style={{ color: "var(--accent)" }}>View all →</Link>
          </div>
          {stats.campaigns.filter(c => ["running", "scheduled", "paused"].includes(c.status)).length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm" style={{ color: "var(--text-3)" }}>No active campaigns</p>
              <Link href="/dashboard/campaigns/new" className="text-xs mt-2 inline-block font-medium" style={{ color: "var(--accent)" }}>Create one →</Link>
            </div>
          ) : (
            <div className="space-y-4">
              {stats.campaigns.filter(c => ["running", "scheduled", "paused"].includes(c.status)).slice(0, 5).map(c => {
                const sc = STATUS_STYLE[c.status] ?? STATUS_STYLE.paused;
                const pct = c.totalCount > 0 ? Math.round((c.sent / c.totalCount) * 100) : 0;
                return (
                  <Link key={c.id} href={`/dashboard/campaigns/${c.id}`} className="block">
                    <div className="flex justify-between items-center mb-1">
                      <p className="text-sm font-medium truncate max-w-[60%]" style={{ color: "var(--text)" }}>{c.name}</p>
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium shrink-0" style={{ background: sc.bg, color: sc.text }}>{c.status}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full" style={{ background: "var(--bg-subtle)" }}>
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "#3b82f6" }} />
                      </div>
                      <span className="text-xs shrink-0" style={{ color: "var(--text-3)" }}>{c.sent}/{c.totalCount}</span>
                    </div>
                  </Link>
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
          {stats.recentConversations.length === 0 ? (
            <p className="text-sm py-8 text-center" style={{ color: "var(--text-3)" }}>No conversations yet</p>
          ) : (
            <div className="space-y-3">
              {stats.recentConversations.map(conv => (
                <Link key={conv.id} href="/dashboard/inbox" className="flex justify-between items-start gap-3 group">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold" style={{ background: "var(--bg-subtle)", color: "var(--text-2)" }}>
                    {conv.customer.firstName?.[0]?.toUpperCase() ?? "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium" style={{ color: "var(--text)" }}>{conv.customer.firstName} {conv.customer.lastName}</p>
                      {conv.unreadCount > 0 && (
                        <span className="text-xs px-1.5 py-0.5 rounded-full font-bold" style={{ background: "#3b82f6", color: "white" }}>{conv.unreadCount}</span>
                      )}
                    </div>
                    <p className="text-xs mt-0.5 truncate" style={{ color: "var(--text-3)" }}>
                      {conv.messages[0]?.direction === "inbound" ? "← " : "→ "}{conv.messages[0]?.body ?? "No messages"}
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
