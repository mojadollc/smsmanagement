"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";

interface QueueJob {
  status: string;
  scheduledAt: string;
  twilioSid: string | null;
  lastError: string | null;
  attempts: number;
}

interface Recipient {
  id: string;
  status: string;
  customer: { id: string; firstName: string; lastName: string; phone: string };
  queue: QueueJob | null;
}

interface Campaign {
  id: string;
  name: string;
  message: string;
  status: string;
  totalCount: number;
  sent: number;
  delivered: number;
  failed: number;
  optedOut: number;
  pending: number;
  dailyLimit: number;
  schedules: unknown;
  createdAt: string;
  recipients: Recipient[];
}

const statusColor: Record<string, { bg: string; color: string }> = {
  pending:   { bg: "rgba(100,116,139,0.15)", color: "#64748b" },
  paused:    { bg: "rgba(249,115,22,0.15)",  color: "#ea580c" },
  sent:      { bg: "rgba(59,130,246,0.15)",  color: "#2563eb" },
  delivered: { bg: "rgba(34,197,94,0.15)",   color: "#16a34a" },
  failed:    { bg: "rgba(239,68,68,0.15)",   color: "#dc2626" },
  skipped:   { bg: "rgba(168,85,247,0.15)",  color: "#9333ea" },
};

const campaignStatusColor: Record<string, { bg: string; color: string }> = {
  draft:     { bg: "rgba(100,116,139,0.15)", color: "#64748b" },
  scheduled: { bg: "rgba(59,130,246,0.15)",  color: "#2563eb" },
  running:   { bg: "rgba(234,179,8,0.15)",   color: "#ca8a04" },
  completed: { bg: "rgba(34,197,94,0.15)",   color: "#16a34a" },
  paused:    { bg: "rgba(249,115,22,0.15)",  color: "#ea580c" },
  cancelled: { bg: "rgba(239,68,68,0.15)",   color: "#dc2626" },
};

export default function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch(`/api/campaigns/${id}`).then((r) => r.json()).then(setCampaign);
  }, [id]);

  if (!campaign) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "var(--accent)" }} />
      </div>
    );
  }

  const cConf = campaignStatusColor[campaign.status] || campaignStatusColor.draft;

  // Resolve effective status per recipient
  const recipients = campaign.recipients.map((r) => {
    const qStatus = r.queue?.status ?? null;
    const effective = qStatus ?? r.status;
    return { ...r, effective };
  });

  const filtered = recipients.filter((r) => {
    const matchFilter = filter === "all" || r.effective === filter;
    const matchSearch =
      !search ||
      `${r.customer.firstName} ${r.customer.lastName} ${r.customer.phone}`
        .toLowerCase()
        .includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const stats = [
    { label: "Total",     value: campaign.totalCount, color: "var(--text)" },
    { label: "Pending",   value: campaign.pending,    color: "#64748b" },
    { label: "Sent",      value: campaign.sent,       color: "#2563eb" },
    { label: "Delivered", value: campaign.delivered,  color: "#16a34a" },
    { label: "Failed",    value: campaign.failed,     color: "#dc2626" },
    { label: "Opted Out", value: campaign.optedOut,   color: "#9333ea" },
  ];

  const filterTabs = ["all", "pending", "sent", "delivered", "failed", "skipped", "paused"];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/dashboard/campaigns" className="text-sm hover:underline" style={{ color: "var(--text-3)" }}>
              ← Campaigns
            </Link>
          </div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>{campaign.name}</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-2)" }}>
            Created {new Date(campaign.createdAt).toLocaleDateString()}
          </p>
        </div>
        <span
          className="text-xs px-3 py-1.5 rounded-full font-semibold shrink-0"
          style={{ background: cConf.bg, color: cConf.color }}
        >
          {campaign.status}
        </span>
      </div>

      {/* Message preview */}
      <div className="card p-4" style={{ background: "var(--bg-card)" }}>
        <p className="text-xs font-medium mb-1.5" style={{ color: "var(--text-3)" }}>MESSAGE</p>
        <p className="text-sm" style={{ color: "var(--text)" }}>{campaign.message}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="card p-3 text-center" style={{ background: "var(--bg-card)" }}>
            <p className="text-xl font-bold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Recipients table */}
      <div className="card overflow-hidden" style={{ background: "var(--bg-card)" }}>
        <div className="px-5 py-4 flex flex-col sm:flex-row gap-3 sm:items-center justify-between" style={{ borderBottom: "1px solid var(--border-soft)" }}>
          <h2 className="font-semibold" style={{ color: "var(--text)" }}>
            Recipients <span className="text-sm font-normal" style={{ color: "var(--text-3)" }}>({filtered.length} shown)</span>
          </h2>
          <input
            className="input text-sm w-full sm:w-56"
            placeholder="Search name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 px-5 py-2 overflow-x-auto" style={{ borderBottom: "1px solid var(--border-soft)" }}>
          {filterTabs.map((tab) => {
            const count = tab === "all" ? recipients.length : recipients.filter((r) => r.effective === tab).length;
            if (tab !== "all" && count === 0) return null;
            return (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className="text-xs px-3 py-1.5 rounded-full font-medium whitespace-nowrap transition-all"
                style={{
                  background: filter === tab ? "var(--accent)" : "var(--bg-subtle)",
                  color: filter === tab ? "white" : "var(--text-2)",
                }}
              >
                {tab === "all" ? "All" : tab.charAt(0).toUpperCase() + tab.slice(1)} ({count})
              </button>
            );
          })}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "var(--bg-subtle)" }}>
                <th className="text-left px-5 py-3 font-medium" style={{ color: "var(--text-3)" }}>Name</th>
                <th className="text-left px-5 py-3 font-medium" style={{ color: "var(--text-3)" }}>Phone</th>
                <th className="text-left px-5 py-3 font-medium" style={{ color: "var(--text-3)" }}>Status</th>
                <th className="text-left px-5 py-3 font-medium" style={{ color: "var(--text-3)" }}>Scheduled At</th>
                <th className="text-left px-5 py-3 font-medium" style={{ color: "var(--text-3)" }}>Attempts</th>
                <th className="text-left px-5 py-3 font-medium" style={{ color: "var(--text-3)" }}>Error</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const conf = statusColor[r.effective] || statusColor.pending;
                return (
                  <tr
                    key={r.id}
                    className="border-b transition-colors hover:bg-[var(--bg-subtle)]"
                    style={{ borderColor: "var(--border-soft)" }}
                  >
                    <td className="px-5 py-3 font-medium" style={{ color: "var(--text)" }}>
                      {r.customer.firstName} {r.customer.lastName}
                    </td>
                    <td className="px-5 py-3 font-mono text-xs" style={{ color: "var(--text-2)" }}>
                      {r.customer.phone}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className="text-xs px-2.5 py-1 rounded-full font-medium"
                        style={{ background: conf.bg, color: conf.color }}
                      >
                        {r.effective}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs" style={{ color: "var(--text-2)" }}>
                      {r.queue?.scheduledAt
                        ? new Date(r.queue.scheduledAt).toLocaleString()
                        : "—"}
                    </td>
                    <td className="px-5 py-3 text-xs" style={{ color: "var(--text-2)" }}>
                      {r.queue?.attempts ?? "—"}
                    </td>
                    <td className="px-5 py-3 text-xs max-w-xs truncate" style={{ color: "#dc2626" }} title={r.queue?.lastError ?? ""}>
                      {r.queue?.lastError ?? "—"}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center" style={{ color: "var(--text-3)" }}>
                    No recipients match this filter
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
