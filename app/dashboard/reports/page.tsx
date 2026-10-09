"use client";

import { useState, useEffect } from "react";

interface Campaign {
  id: string;
  name: string;
  totalCount: number;
  sent: number;
  delivered: number;
  failed: number;
  optedOut: number;
  status: string;
}

interface ReportData {
  totalSent: number;
  totalDelivered: number;
  totalFailed: number;
  totalInbound: number;
  totalOptOuts: number;
  totalOptIns: number;
  totalCustomers: number;
  sentToday: number;
  deliveredToday: number;
  failedPeriod: number;
  inboundPeriod: number;
  dailyLimit: number;
  activeCampaignsCount: number;
  campaigns: Campaign[];
  dailyTrend: { date: string; sent: number; received: number }[];
  period: string;
}

type Period = "day" | "week" | "month";

function DonutChart({ delivered, failed, pending }: { delivered: number; failed: number; pending: number }) {
  const total = delivered + failed + pending;
  const r = 42;
  const circ = 2 * Math.PI * r;

  if (total === 0) {
    return (
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-44 h-44 flex items-center justify-center">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <circle cx="50" cy="50" r={r} fill="none" stroke="var(--bg-subtle)" strokeWidth="12" />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="text-2xl font-bold" style={{ color: "var(--text)" }}>0</span>
            <span className="text-xs" style={{ color: "var(--text-3)" }}>Total</span>
          </div>
        </div>
        <p className="text-sm" style={{ color: "var(--text-3)" }}>No messages sent yet</p>
      </div>
    );
  }

  const gap = 2;
  const segments = [
    { pct: delivered / total, color: "#22c55e", offset: 0 },
    { pct: failed / total, color: "#ef4444", offset: (delivered / total) * circ + gap },
    { pct: pending / total, color: "#94a3b8", offset: ((delivered + failed) / total) * circ + gap * 2 },
  ];

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-44 h-44 flex items-center justify-center">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          <circle cx="50" cy="50" r={r} fill="none" stroke="var(--bg-subtle)" strokeWidth="12" />
          {segments.map((s, i) =>
            s.pct > 0 ? (
              <circle key={i} cx="50" cy="50" r={r} fill="none" stroke={s.color} strokeWidth="12"
                strokeDasharray={`${s.pct * circ - gap} ${circ}`}
                strokeDashoffset={-s.offset} strokeLinecap="round"
                style={{ transition: "stroke-dasharray 0.8s ease" }}
              />
            ) : null
          )}
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className="text-2xl font-bold" style={{ color: "var(--text)" }}>{total.toLocaleString()}</span>
          <span className="text-xs" style={{ color: "var(--text-3)" }}>Total</span>
        </div>
      </div>
      <div className="flex items-center gap-5">
        {[
          { label: "Delivered", value: delivered, color: "#22c55e" },
          { label: "Failed", value: failed, color: "#ef4444" },
          { label: "Pending", value: pending, color: "#94a3b8" },
        ].map(s => (
          <div key={s.label} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.color }} />
            <span className="text-xs" style={{ color: "var(--text-2)" }}>
              {s.label} <span className="font-semibold" style={{ color: "var(--text)" }}>{s.value.toLocaleString()}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DualLineChart({ data }: { data: { date: string; sent: number; received: number }[] }) {
  const W = 320, H = 130, padL = 30, padB = 22, padT = 12, padR = 12;
  const chartW = W - padL - padR;
  const chartH = H - padB - padT;
  const maxVal = Math.max(...data.flatMap(d => [d.sent, d.received]), 1);
  const gridLines = 4;

  const pts = (key: "sent" | "received") =>
    data.map((d, i) => ({
      x: padL + (i / Math.max(data.length - 1, 1)) * chartW,
      y: padT + chartH - (d[key] / maxVal) * chartH,
      ...d,
    }));

  const sentPts = pts("sent");
  const recvPts = pts("received");
  const sentLine = sentPts.map(p => `${p.x},${p.y}`).join(" ");
  const recvLine = recvPts.map(p => `${p.x},${p.y}`).join(" ");
  const sentArea = `${padL},${padT + chartH} ${sentLine} ${padL + chartW},${padT + chartH}`;

  const labels = data.map(d => {
    const dt = new Date(d.date + "T00:00:00");
    return dt.toLocaleDateString("en-US", { weekday: "short" });
  });

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 140 }}>
        <defs>
          <linearGradient id="sentGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[...Array(gridLines + 1)].map((_, i) => {
          const y = padT + (i / gridLines) * chartH;
          const val = Math.round(maxVal - (i / gridLines) * maxVal);
          return (
            <g key={i}>
              <line x1={padL} y1={y} x2={padL + chartW} y2={y} stroke="var(--border)" strokeWidth="0.5" strokeDasharray="3,3" />
              <text x={padL - 4} y={y + 3} textAnchor="end" fontSize="7" fill="var(--text-3)">{val}</text>
            </g>
          );
        })}
        <polygon points={sentArea} fill="url(#sentGrad)" />
        <polyline points={sentLine} fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        <polyline points={recvLine} fill="none" stroke="#22c55e" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" strokeDasharray="4,2" />
        {sentPts.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="3" fill="#3b82f6" stroke="var(--bg-card)" strokeWidth="1.5" />
            <text x={p.x} y={H - 5} textAnchor="middle" fontSize="7" fill="var(--text-3)">{labels[i]}</text>
          </g>
        ))}
        {recvPts.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="2.5" fill="#22c55e" stroke="var(--bg-card)" strokeWidth="1.5" />
        ))}
      </svg>
      <div className="flex items-center gap-5 mt-1 justify-center">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 rounded" style={{ background: "#3b82f6", display: "inline-block" }} />
          <span className="text-xs" style={{ color: "var(--text-3)" }}>Sent</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 rounded" style={{ background: "#22c55e", display: "inline-block" }} />
          <span className="text-xs" style={{ color: "var(--text-3)" }}>Received</span>
        </div>
      </div>
    </div>
  );
}

function CampaignTable({ campaigns }: { campaigns: Campaign[] }) {
  if (campaigns.length === 0) {
    return <p className="text-sm py-8 text-center" style={{ color: "var(--text-3)" }}>No campaigns yet</p>;
  }

  const STATUS_STYLE: Record<string, { bg: string; text: string }> = {
    running:   { bg: "rgba(234,179,8,0.12)",   text: "#ca8a04" },
    scheduled: { bg: "rgba(59,130,246,0.12)",  text: "#2563eb" },
    completed: { bg: "rgba(34,197,94,0.12)",   text: "#16a34a" },
    paused:    { bg: "rgba(148,163,184,0.12)", text: "#64748b" },
    cancelled: { bg: "rgba(239,68,68,0.12)",   text: "#dc2626" },
    draft:     { bg: "rgba(148,163,184,0.12)", text: "#64748b" },
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr style={{ borderBottom: "1px solid var(--border)" }}>
            {["Campaign", "Status", "Sent", "Delivered", "Failed", "Opt-Out", "Rate"].map(h => (
              <th key={h} className="text-left py-2 px-3 text-xs font-medium" style={{ color: "var(--text-3)" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {campaigns.map(c => {
            const sc = STATUS_STYLE[c.status] ?? STATUS_STYLE.draft;
            const rate = c.sent > 0 ? Math.round((c.delivered / c.sent) * 100) : 0;
            return (
              <tr key={c.id} style={{ borderBottom: "1px solid var(--border)" }}>
                <td className="py-3 px-3 font-medium max-w-[180px] truncate" style={{ color: "var(--text)" }}>{c.name}</td>
                <td className="py-3 px-3">
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: sc.bg, color: sc.text }}>{c.status}</span>
                </td>
                <td className="py-3 px-3" style={{ color: "var(--text-2)" }}>{c.sent.toLocaleString()}</td>
                <td className="py-3 px-3 font-medium" style={{ color: "#22c55e" }}>{c.delivered.toLocaleString()}</td>
                <td className="py-3 px-3" style={{ color: c.failed > 0 ? "#ef4444" : "var(--text-3)" }}>{c.failed.toLocaleString()}</td>
                <td className="py-3 px-3" style={{ color: c.optedOut > 0 ? "#f59e0b" : "var(--text-3)" }}>{c.optedOut.toLocaleString()}</td>
                <td className="py-3 px-3">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 rounded-full" style={{ background: "var(--bg-subtle)" }}>
                      <div className="h-full rounded-full" style={{ width: `${rate}%`, background: rate >= 80 ? "#22c55e" : rate >= 50 ? "#f59e0b" : "#ef4444" }} />
                    </div>
                    <span className="text-xs font-medium" style={{ color: "var(--text-2)" }}>{rate}%</span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function ReportsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>("day");

  useEffect(() => {
    setLoading(true);
    fetch(`/api/reports?period=${period}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [period]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-32 rounded-lg" style={{ background: "var(--bg-subtle)" }} />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 rounded-2xl" style={{ background: "var(--bg-subtle)" }} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => <div key={i} className="h-64 rounded-2xl" style={{ background: "var(--bg-subtle)" }} />)}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <span style={{ color: "var(--text-3)" }}>Failed to load reports</span>
      </div>
    );
  }

  const pending = Math.max(0, data.totalSent - data.totalDelivered - data.totalFailed);
  const deliveryRate = data.totalSent > 0 ? Math.round((data.totalDelivered / data.totalSent) * 100) : 0;
  const limitPct = Math.min((data.sentToday / (data.dailyLimit || 1)) * 100, 100);
  const remaining = Math.max(0, data.dailyLimit - data.sentToday);
  const periodLabel = period === "day" ? "Today" : period === "week" ? "7 Days" : "30 Days";

  const statCards = [
    { label: `Sent (${periodLabel})`, value: data.sentToday.toLocaleString(), color: "#3b82f6", bg: "rgba(59,130,246,0.08)",
      sub: `${data.totalSent.toLocaleString()} all-time`,
      icon: <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /> },
    { label: `Delivered (${periodLabel})`, value: data.deliveredToday.toLocaleString(), color: "#22c55e", bg: "rgba(34,197,94,0.08)",
      sub: `${data.totalDelivered.toLocaleString()} all-time`,
      icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /> },
    { label: `Received (${periodLabel})`, value: data.inboundPeriod.toLocaleString(), color: "#8b5cf6", bg: "rgba(139,92,246,0.08)",
      sub: `${data.totalInbound.toLocaleString()} all-time`,
      icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 3.75H6.912a2.25 2.25 0 00-2.15 1.588L2.35 13.177a2.25 2.25 0 00-.1.661V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 00-2.15-1.588H15M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859M12 3v8.25m0 0l-3-3m3 3l3-3" /> },
    { label: "All-time Rate", value: `${deliveryRate}%`, color: "#f59e0b", bg: "rgba(245,158,11,0.08)",
      sub: `${data.totalOptOuts.toLocaleString()} opted out`,
      icon: <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>Reports</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-2)" }}>SMS delivery analytics and campaign performance</p>
        </div>
        <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)" }}>
          {(["day", "week", "month"] as Period[]).map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className="px-4 py-1.5 rounded-lg text-sm font-medium transition-all"
              style={{
                background: period === p ? "var(--bg-card)" : "transparent",
                color: period === p ? "var(--accent)" : "var(--text-3)",
                boxShadow: period === p ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
              }}
            >
              {p === "day" ? "Today" : p === "week" ? "7 Days" : "30 Days"}
            </button>
          ))}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(s => (
          <div key={s.label} className="rounded-2xl p-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: s.bg }}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke={s.color} strokeWidth={1.8}>{s.icon}</svg>
              </div>
              <span className="text-xs font-medium" style={{ color: "var(--text-3)" }}>{s.label}</span>
            </div>
            <p className="text-3xl font-bold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs mt-1" style={{ color: "var(--text-3)" }}>{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl p-6" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <h2 className="font-semibold mb-5" style={{ color: "var(--text)" }}>All-time Delivery Breakdown</h2>
          <div className="flex items-center justify-center">
            <DonutChart delivered={data.totalDelivered} failed={data.totalFailed} pending={pending} />
          </div>
        </div>

        <div className="rounded-2xl p-6" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <h2 className="font-semibold mb-4" style={{ color: "var(--text)" }}>Activity — Last 7 Days</h2>
          {data.dailyTrend?.length > 0 ? (
            <DualLineChart data={data.dailyTrend} />
          ) : (
            <div className="flex items-center justify-center h-36">
              <span className="text-sm" style={{ color: "var(--text-3)" }}>No data</span>
            </div>
          )}
        </div>
      </div>

      {/* Daily Limit + Quick Stats */}
      <div className="rounded-2xl p-6" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
        <h2 className="font-semibold mb-4" style={{ color: "var(--text)" }}>Daily Limit — Today</h2>
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm" style={{ color: "var(--text-2)" }}>Usage</span>
            <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>
              {data.sentToday.toLocaleString()} / {data.dailyLimit.toLocaleString()}
            </span>
          </div>
          <div className="h-3 rounded-full overflow-hidden" style={{ background: "var(--bg-subtle)" }}>
            <div className="h-full rounded-full transition-all duration-700"
              style={{ width: `${limitPct}%`, background: limitPct >= 100 ? "#ef4444" : limitPct >= 80 ? "#f59e0b" : "linear-gradient(90deg,#3b82f6,#6366f1)" }}
            />
          </div>
          <p className="text-xs mt-1.5" style={{ color: "var(--text-3)" }}>{limitPct.toFixed(1)}% used · {remaining.toLocaleString()} remaining</p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
          {[
            { label: "Sent Today", value: data.sentToday, color: "#3b82f6" },
            { label: "Delivered Today", value: data.deliveredToday, color: "#22c55e" },
            { label: "Failed Today", value: data.failedPeriod, color: data.failedPeriod > 0 ? "#ef4444" : "var(--text-3)" },
            { label: "Remaining", value: remaining, color: "var(--text)" },
          ].map(s => (
            <div key={s.label} className="text-center p-4 rounded-xl" style={{ background: "var(--bg-subtle)" }}>
              <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value.toLocaleString()}</p>
              <p className="text-xs mt-1" style={{ color: "var(--text-3)" }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Audience Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {[
          { label: "Total Customers", value: data.totalCustomers, color: "#06b6d4", bg: "rgba(6,182,212,0.1)",
            icon: <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /> },
          { label: "Opted In", value: data.totalOptIns, color: "#22c55e", bg: "rgba(34,197,94,0.1)",
            icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /> },
          { label: "Opted Out", value: data.totalOptOuts, color: "#ef4444", bg: "rgba(239,68,68,0.1)",
            icon: <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /> },
        ].map(s => (
          <div key={s.label} className="rounded-2xl p-5 flex items-center gap-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: s.bg }}>
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke={s.color} strokeWidth={1.8}>{s.icon}</svg>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide mb-0.5" style={{ color: "var(--text-3)" }}>{s.label}</p>
              <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value.toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Campaign Performance Table */}
      <div className="rounded-2xl p-6" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
        <h2 className="font-semibold mb-5" style={{ color: "var(--text)" }}>Campaign Performance</h2>
        <CampaignTable campaigns={data.campaigns ?? []} />
      </div>
    </div>
  );
}
