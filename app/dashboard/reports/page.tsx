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
  dailyLimit: number;
  campaigns: Campaign[];
}

function DonutChart({ delivered, failed, pending }: { delivered: number; failed: number; pending: number }) {
  const total = delivered + failed + pending;
  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <div className="w-32 h-32 rounded-full flex items-center justify-center" style={{ background: "var(--bg-subtle)" }}>
          <span className="text-xs" style={{ color: "var(--text-3)" }}>No data</span>
        </div>
      </div>
    );
  }

  const deliveredPct = (delivered / total) * 100;
  const failedPct = (failed / total) * 100;
  const pendingPct = (pending / total) * 100;

  // SVG circle circumference = 2 * PI * r, with r=45 => ~283
  const circumference = 2 * Math.PI * 45;
  const deliveredDash = (deliveredPct / 100) * circumference;
  const failedDash = (failedPct / 100) * circumference;
  const pendingDash = (pendingPct / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 100 100" className="w-40 h-40 -rotate-90">
        {/* Background circle */}
        <circle cx="50" cy="50" r="45" fill="none" stroke="var(--bg-subtle)" strokeWidth="10" />
        {/* Delivered - Green */}
        <circle 
          cx="50" cy="50" r="45" fill="none" 
          stroke="#22c55e" strokeWidth="10"
          strokeDasharray={`${deliveredDash} ${circumference}`}
          strokeDashoffset="0"
          className="transition-all duration-1000"
        />
        {/* Failed - Red */}
        <circle 
          cx="50" cy="50" r="45" fill="none" 
          stroke="#ef4444" strokeWidth="10"
          strokeDasharray={`${failedDash} ${circumference}`}
          strokeDashoffset={-deliveredDash}
          className="transition-all duration-1000"
        />
        {/* Pending - Gray */}
        <circle 
          cx="50" cy="50" r="45" fill="none" 
          stroke="#94a3b8" strokeWidth="10"
          strokeDasharray={`${pendingDash} ${circumference}`}
          strokeDashoffset={-(deliveredDash + failedDash)}
          className="transition-all duration-1000"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center pointer-events-none" style={{ marginTop: "-10rem" }}>
        <span className="text-2xl font-bold" style={{ color: "var(--text)" }}>{total}</span>
        <span className="text-xs" style={{ color: "var(--text-3)" }}>Total</span>
      </div>
    </div>
  );
}

function BarChart({ campaigns }: { campaigns: Campaign[] }) {
  if (campaigns.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <span className="text-sm" style={{ color: "var(--text-3)" }}>No campaigns yet</span>
      </div>
    );
  }

  const maxTotal = Math.max(...campaigns.map(c => c.totalCount || 1));

  return (
    <div className="space-y-3">
      {campaigns.slice(0, 5).map((c) => {
        const deliveredPct = c.totalCount > 0 ? (c.delivered / c.totalCount) * 100 : 0;
        const failedPct = c.totalCount > 0 ? (c.failed / c.totalCount) * 100 : 0;
        const barWidth = (c.totalCount / maxTotal) * 100;

        return (
          <div key={c.id} className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium truncate max-w-[60%]" style={{ color: "var(--text)" }}>{c.name}</span>
              <span className="text-xs" style={{ color: "var(--text-3)" }}>{c.delivered}/{c.totalCount}</span>
            </div>
            <div className="h-6 rounded-lg overflow-hidden" style={{ background: "var(--bg-subtle)", width: `${Math.max(barWidth, 10)}%` }}>
              <div className="h-full flex">
                <div 
                  className="h-full transition-all duration-500" 
                  style={{ width: `${deliveredPct}%`, background: "linear-gradient(90deg, #22c55e, #16a34a)" }}
                />
                <div 
                  className="h-full transition-all duration-500" 
                  style={{ width: `${failedPct}%`, background: "linear-gradient(90deg, #ef4444, #dc2626)" }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function LineChart({ data }: { data: { date: string; sent: number }[] }) {
  const maxSent = Math.max(...data.map(d => d.sent), 1);
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - (d.sent / maxSent) * 80;
    return `${x},${y}`;
  }).join(" ");

  return (
    <svg viewBox="0 0 100 100" className="w-full h-40">
      {/* Grid lines */}
      {[0, 25, 50, 75, 100].map((y) => (
        <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="var(--border)" strokeWidth="0.5" />
      ))}
      {/* Line */}
      <polyline
        fill="none"
        stroke="#3b82f6"
        strokeWidth="2"
        points={points}
      />
      {/* Area fill */}
      <polygon
        fill="url(#gradient)"
        points={`0,100 ${points} 100,100`}
        opacity="0.3"
      />
      {/* Gradient definition */}
      <defs>
        <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Data points */}
      {data.map((d, i) => {
        const x = (i / (data.length - 1)) * 100;
        const y = 100 - (d.sent / maxSent) * 80;
        return (
          <circle key={i} cx={x} cy={y} r="3" fill="#3b82f6" />
        );
      })}
    </svg>
  );
}

export default function ReportsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/reports");
        if (res.ok) {
          setData(await res.json());
        }
      } catch (e) {
        console.error("Failed to load reports:", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse h-8 w-32 rounded" style={{ background: "var(--bg-subtle)" }} />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse h-24 rounded-2xl" style={{ background: "var(--bg-subtle)" }} />
          ))}
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

  const pending = data.totalSent - data.totalDelivered - data.totalFailed;
  const deliveryRate = data.totalSent > 0 ? Math.round((data.totalDelivered / data.totalSent) * 100) : 0;

  // Generate mock daily data for the last 7 days
  const last7Days = [...Array(7)].map((_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return {
      date: date.toLocaleDateString("en-US", { weekday: "short" }),
      sent: Math.floor(Math.random() * (data.sentToday || 50)) + 10,
    };
  });

  const statCards = [
    { label: "Total Sent", value: data.totalSent.toLocaleString(), icon: "📤", color: "#3b82f6" },
    { label: "Delivered", value: data.totalDelivered.toLocaleString(), icon: "✅", color: "#22c55e" },
    { label: "Failed", value: data.totalFailed.toLocaleString(), icon: "❌", color: "#ef4444" },
    { label: "Delivery Rate", value: `${deliveryRate}%`, icon: "📊", color: "#8b5cf6" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>Reports</h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--text-2)" }}>SMS delivery analytics and campaign performance</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <div
            key={s.label}
            className="rounded-2xl p-5 transition-all hover:scale-[1.02]"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
          >
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">{s.icon}</span>
              <span className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--text-3)" }}>{s.label}</span>
            </div>
            <p className="text-3xl font-bold" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Delivery Breakdown */}
        <div className="rounded-2xl p-6" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <h2 className="font-semibold mb-4" style={{ color: "var(--text)" }}>Delivery Breakdown</h2>
          <div className="flex items-center justify-center">
            <div className="relative">
              <DonutChart delivered={data.totalDelivered} failed={data.totalFailed} pending={pending} />
            </div>
          </div>
          <div className="flex items-center justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ background: "#22c55e" }} />
              <span className="text-xs" style={{ color: "var(--text-2)" }}>Delivered ({data.totalDelivered})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ background: "#ef4444" }} />
              <span className="text-xs" style={{ color: "var(--text-2)" }}>Failed ({data.totalFailed})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ background: "#94a3b8" }} />
              <span className="text-xs" style={{ color: "var(--text-2)" }}>Pending ({pending})</span>
            </div>
          </div>
        </div>

        {/* Daily Trend */}
        <div className="rounded-2xl p-6" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <h2 className="font-semibold mb-4" style={{ color: "var(--text)" }}>Daily Activity (Last 7 Days)</h2>
          <LineChart data={last7Days} />
          <div className="flex items-center justify-between mt-4 px-2">
            {last7Days.map((d, i) => (
              <span key={i} className="text-xs" style={{ color: "var(--text-3)" }}>{d.date}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Today Stats */}
      <div className="rounded-2xl p-6" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
        <h2 className="font-semibold mb-4" style={{ color: "var(--text)" }}>Today&apos;s Progress</h2>
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm" style={{ color: "var(--text-2)" }}>Daily Limit Usage</span>
              <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>{data.sentToday} / {data.dailyLimit}</span>
            </div>
            <div className="h-4 rounded-full overflow-hidden" style={{ background: "var(--bg-subtle)" }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min((data.sentToday / data.dailyLimit) * 100, 100)}%`,
                  background: data.sentToday >= data.dailyLimit ? "#ef4444" : "linear-gradient(90deg, #3b82f6, #6366f1)",
                }}
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 pt-2">
            <div className="text-center p-3 rounded-xl" style={{ background: "var(--bg-subtle)" }}>
              <p className="text-2xl font-bold" style={{ color: "#3b82f6" }}>{data.sentToday}</p>
              <p className="text-xs mt-1" style={{ color: "var(--text-3)" }}>Sent Today</p>
            </div>
            <div className="text-center p-3 rounded-xl" style={{ background: "var(--bg-subtle)" }}>
              <p className="text-2xl font-bold" style={{ color: "#22c55e" }}>{data.deliveredToday}</p>
              <p className="text-xs mt-1" style={{ color: "var(--text-3)" }}>Delivered Today</p>
            </div>
            <div className="text-center p-3 rounded-xl" style={{ background: "var(--bg-subtle)" }}>
              <p className="text-2xl font-bold" style={{ color: "var(--text)" }}>{data.dailyLimit - data.sentToday}</p>
              <p className="text-xs mt-1" style={{ color: "var(--text-3)" }}>Remaining</p>
            </div>
          </div>
        </div>
      </div>

      {/* Campaign Performance */}
      <div className="rounded-2xl p-6" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
        <h2 className="font-semibold mb-4" style={{ color: "var(--text)" }}>Campaign Performance</h2>
        <BarChart campaigns={data.campaigns} />
        <div className="flex items-center gap-6 mt-4 pt-4" style={{ borderTop: "1px solid var(--border)" }}>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded" style={{ background: "#22c55e" }} />
            <span className="text-xs" style={{ color: "var(--text-2)" }}>Delivered</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded" style={{ background: "#ef4444" }} />
            <span className="text-xs" style={{ color: "var(--text-2)" }}>Failed</span>
          </div>
        </div>
      </div>

      {/* Opt-outs */}
      <div className="rounded-2xl p-6" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
        <h2 className="font-semibold mb-2" style={{ color: "var(--text)" }}>Opt-Outs</h2>
        <p className="text-sm mb-4" style={{ color: "var(--text-2)" }}>Customers who have unsubscribed from SMS</p>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "rgba(234, 88, 12, 0.1)" }}>
            <span className="text-2xl">🚫</span>
          </div>
          <div>
            <p className="text-3xl font-bold" style={{ color: "#ea580c" }}>{data.totalOptOuts}</p>
            <p className="text-xs" style={{ color: "var(--text-3)" }}>Total opted out</p>
          </div>
        </div>
      </div>
    </div>
  );
}
