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
  totalOptOuts: number;
  sentToday: number;
  deliveredToday: number;
  failedPeriod: number;
  dailyLimit: number;
  campaigns: Campaign[];
  dailyTrend: { date: string; sent: number }[];
}

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
      </div>
    );
  }

  const dPct = delivered / total;
  const fPct = failed / total;
  const pPct = pending / total;
  const gap = 2;

  const segments = [
    { pct: dPct, color: "#22c55e", offset: 0 },
    { pct: fPct, color: "#ef4444", offset: dPct * circ + gap },
    { pct: pPct, color: "#94a3b8", offset: (dPct + fPct) * circ + gap * 2 },
  ];

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-44 h-44 flex items-center justify-center">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          <circle cx="50" cy="50" r={r} fill="none" stroke="var(--bg-subtle)" strokeWidth="12" />
          {segments.map((s, i) =>
            s.pct > 0 ? (
              <circle
                key={i}
                cx="50" cy="50" r={r}
                fill="none"
                stroke={s.color}
                strokeWidth="12"
                strokeDasharray={`${s.pct * circ - gap} ${circ}`}
                strokeDashoffset={-s.offset}
                strokeLinecap="round"
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
        ].map((s) => (
          <div key={s.label} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.color }} />
            <span className="text-xs" style={{ color: "var(--text-2)" }}>{s.label} <span className="font-semibold" style={{ color: "var(--text)" }}>{s.value.toLocaleString()}</span></span>
          </div>
        ))}
      </div>
    </div>
  );
}

function LineChart({ data }: { data: { date: string; sent: number }[] }) {
  const W = 300;
  const H = 120;
  const padL = 28;
  const padB = 20;
  const padT = 10;
  const padR = 10;
  const chartW = W - padL - padR;
  const chartH = H - padB - padT;

  const maxVal = Math.max(...data.map((d) => d.sent), 1);
  const gridLines = 4;

  const pts = data.map((d, i) => {
    const x = padL + (i / (data.length - 1 || 1)) * chartW;
    const y = padT + chartH - (d.sent / maxVal) * chartH;
    return { x, y, ...d };
  });

  const polyline = pts.map((p) => `${p.x},${p.y}`).join(" ");
  const area = `${padL},${padT + chartH} ${polyline} ${padL + chartW},${padT + chartH}`;

  const labels = data.map((d) => {
    const dt = new Date(d.date + "T00:00:00");
    return dt.toLocaleDateString("en-US", { weekday: "short" });
  });

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 140 }}>
      <defs>
        <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Grid */}
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

      {/* Area */}
      <polygon points={area} fill="url(#lineGrad)" />

      {/* Line */}
      <polyline points={polyline} fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

      {/* Dots + x-labels */}
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="3" fill="#3b82f6" stroke="var(--bg-card)" strokeWidth="1.5" />
          <text x={p.x} y={H - 4} textAnchor="middle" fontSize="7" fill="var(--text-3)">{labels[i]}</text>
        </g>
      ))}
    </svg>
  );
}

function BarChart({ campaigns }: { campaigns: Campaign[] }) {
  if (campaigns.length === 0) {
    return (
      <div className="flex items-center justify-center py-10">
        <span className="text-sm" style={{ color: "var(--text-3)" }}>No campaigns yet</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {campaigns.slice(0, 6).map((c) => {
        const total = c.totalCount || 1;
        const dPct = Math.round((c.delivered / total) * 100);
        const fPct = Math.round((c.failed / total) * 100);
        const sPct = Math.max(0, 100 - dPct - fPct);
        return (
          <div key={c.id}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium truncate max-w-[55%]" style={{ color: "var(--text)" }}>{c.name}</span>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs" style={{ color: "#22c55e" }}>{c.delivered} ✓</span>
                {c.failed > 0 && <span className="text-xs" style={{ color: "#ef4444" }}>{c.failed} ✗</span>}
                <span className="text-xs" style={{ color: "var(--text-3)" }}>{c.totalCount} total</span>
              </div>
            </div>
            <div className="h-5 rounded-full overflow-hidden flex" style={{ background: "var(--bg-subtle)" }}>
              {dPct > 0 && (
                <div className="h-full transition-all duration-700" style={{ width: `${dPct}%`, background: "linear-gradient(90deg,#22c55e,#16a34a)" }} />
              )}
              {fPct > 0 && (
                <div className="h-full transition-all duration-700" style={{ width: `${fPct}%`, background: "linear-gradient(90deg,#ef4444,#dc2626)" }} />
              )}
              {sPct > 0 && (
                <div className="h-full transition-all duration-700" style={{ width: `${sPct}%`, background: "var(--bg-subtle)" }} />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

type Period = "day" | "week" | "month";

export default function ReportsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>("day");

  useEffect(() => {
    setLoading(true);
    fetch(`/api/reports?period=${period}`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { setData(d); setLoading(false); })
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

  const statCards = [
    { label: period === "day" ? "Sent Today" : period === "week" ? "Sent (7d)" : "Sent (30d)", value: data.sentToday.toLocaleString(), color: "#3b82f6", bg: "rgba(59,130,246,0.08)",
      icon: <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /> },
    { label: "Delivered", value: data.deliveredToday.toLocaleString(), color: "#22c55e", bg: "rgba(34,197,94,0.08)",
      icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /> },
    { label: "Failed", value: (data.failedPeriod ?? data.totalFailed).toLocaleString(), color: "#ef4444", bg: "rgba(239,68,68,0.08)",
      icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /> },
    { label: "All-time Rate", value: `${deliveryRate}%`, color: "#8b5cf6", bg: "rgba(139,92,246,0.08)",
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
          {(["day", "week", "month"] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
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
        {statCards.map((s) => (
          <div key={s.label} className="rounded-2xl p-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: s.bg }}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke={s.color} strokeWidth={1.8}>{s.icon}</svg>
              </div>
              <span className="text-xs font-medium" style={{ color: "var(--text-3)" }}>{s.label}</span>
            </div>
            <p className="text-3xl font-bold" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Donut */}
        <div className="rounded-2xl p-6" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <h2 className="font-semibold mb-5" style={{ color: "var(--text)" }}>Delivery Breakdown</h2>
          <div className="flex items-center justify-center">
            <DonutChart delivered={data.totalDelivered} failed={data.totalFailed} pending={pending} />
          </div>
        </div>

        {/* Line Chart */}
        <div className="rounded-2xl p-6" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <h2 className="font-semibold mb-5" style={{ color: "var(--text)" }}>Daily Activity — Last 7 Days</h2>
          {data.dailyTrend && data.dailyTrend.length > 0 ? (
            <LineChart data={data.dailyTrend} />
          ) : (
            <div className="flex items-center justify-center h-36">
              <span className="text-sm" style={{ color: "var(--text-3)" }}>No data</span>
            </div>
          )}
        </div>
      </div>

      {/* Today's Progress */}
      <div className="rounded-2xl p-6" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
        <h2 className="font-semibold mb-5" style={{ color: "var(--text)" }}>Today&apos;s Progress</h2>
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm" style={{ color: "var(--text-2)" }}>Daily Limit Usage</span>
            <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>
              {data.sentToday.toLocaleString()} / {data.dailyLimit.toLocaleString()}
            </span>
          </div>
          <div className="h-3 rounded-full overflow-hidden" style={{ background: "var(--bg-subtle)" }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${limitPct}%`,
                background: limitPct >= 100 ? "#ef4444" : limitPct >= 80 ? "#f59e0b" : "linear-gradient(90deg,#3b82f6,#6366f1)",
              }}
            />
          </div>
          <p className="text-xs mt-1.5" style={{ color: "var(--text-3)" }}>{limitPct.toFixed(1)}% used</p>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Sent Today", value: data.sentToday, color: "#3b82f6" },
            { label: "Delivered Today", value: data.deliveredToday, color: "#22c55e" },
            { label: "Remaining", value: remaining, color: "var(--text)" },
          ].map((s) => (
            <div key={s.label} className="text-center p-4 rounded-xl" style={{ background: "var(--bg-subtle)" }}>
              <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value.toLocaleString()}</p>
              <p className="text-xs mt-1" style={{ color: "var(--text-3)" }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Campaign Performance */}
      <div className="rounded-2xl p-6" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold" style={{ color: "var(--text)" }}>Campaign Performance</h2>
          <div className="flex items-center gap-4">
            {[{ color: "#22c55e", label: "Delivered" }, { color: "#ef4444", label: "Failed" }, { color: "var(--bg-subtle)", label: "Pending", border: "var(--border)" }].map((l) => (
              <div key={l.label} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: l.color, border: l.border ? `1px solid ${l.border}` : undefined }} />
                <span className="text-xs" style={{ color: "var(--text-3)" }}>{l.label}</span>
              </div>
            ))}
          </div>
        </div>
        <BarChart campaigns={data.campaigns || []} />
      </div>

      {/* Opt-outs */}
      <div className="rounded-2xl p-6" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
        <h2 className="font-semibold mb-1" style={{ color: "var(--text)" }}>Opt-Outs</h2>
        <p className="text-sm mb-5" style={{ color: "var(--text-2)" }}>Customers who have unsubscribed from SMS</p>
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0" style={{ background: "rgba(234,88,12,0.1)" }}>
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="#ea580c" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </div>
          <div>
            <p className="text-3xl font-bold" style={{ color: "#ea580c" }}>{data.totalOptOuts.toLocaleString()}</p>
            <p className="text-sm mt-0.5" style={{ color: "var(--text-3)" }}>Total opted out</p>
          </div>
        </div>
      </div>
    </div>
  );
}
