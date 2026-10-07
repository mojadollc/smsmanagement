"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Campaign {
  id: string;
  name: string;
  status: string;
  totalCount: number;
  sent: number;
  delivered: number;
  failed: number;
  createdAt: string;
}

const statusConfig: Record<string, { bg: string; color: string }> = {
  draft: { bg: "rgba(100,116,139,0.15)", color: "#64748b" },
  scheduled: { bg: "rgba(59,130,246,0.15)", color: "#2563eb" },
  running: { bg: "rgba(234,179,8,0.15)", color: "#ca8a04" },
  completed: { bg: "rgba(34,197,94,0.15)", color: "#16a34a" },
  paused: { bg: "rgba(249,115,22,0.15)", color: "#ea580c" },
  cancelled: { bg: "rgba(239,68,68,0.15)", color: "#dc2626" },
};

export default function CampaignList() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  useEffect(() => {
    fetch("/api/campaigns").then((r) => r.json()).then(setCampaigns);
  }, []);

  async function action(id: string, act: "pause" | "resume" | "cancel") {
    await fetch(`/api/campaigns/${id}/${act}`, { method: "POST" });
    fetch("/api/campaigns").then((r) => r.json()).then(setCampaigns);
  }

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>Campaigns</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-2)" }}>Manage your SMS campaigns</p>
        </div>
        <Link href="/dashboard/campaigns/new" className="btn-primary px-5 py-2.5 text-sm font-medium">+ New Campaign</Link>
      </div>

      <div className="card overflow-hidden" style={{ background: "var(--bg-card)" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "var(--bg-subtle)" }}>
                <th className="text-left px-5 py-3 font-medium" style={{ color: "var(--text-3)" }}>Campaign</th>
                <th className="text-left px-5 py-3 font-medium" style={{ color: "var(--text-3)" }}>Total</th>
                <th className="text-left px-5 py-3 font-medium" style={{ color: "var(--text-3)" }}>Sent</th>
                <th className="text-left px-5 py-3 font-medium" style={{ color: "var(--text-3)" }}>Delivered</th>
                <th className="text-left px-5 py-3 font-medium" style={{ color: "var(--text-3)" }}>Failed</th>
                <th className="text-left px-5 py-3 font-medium" style={{ color: "var(--text-3)" }}>Status</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c) => {
                const conf = statusConfig[c.status] || statusConfig.draft;
                return (
                  <tr key={c.id} className="border-b transition-colors hover:bg-[var(--bg-subtle)]" style={{ borderColor: "var(--border-soft)" }}>
                    <td className="px-5 py-3 font-medium" style={{ color: "var(--text)" }}>{c.name}</td>
                    <td className="px-5 py-3" style={{ color: "var(--text-2)" }}>{c.totalCount}</td>
                    <td className="px-5 py-3" style={{ color: "var(--text-2)" }}>{c.sent}</td>
                    <td className="px-5 py-3 font-medium" style={{ color: "#16a34a" }}>{c.delivered}</td>
                    <td className="px-5 py-3 font-medium" style={{ color: c.failed > 0 ? "#dc2626" : "var(--text-2)" }}>{c.failed}</td>
                    <td className="px-5 py-3">
                      <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: conf.bg, color: conf.color }}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex gap-2 items-center">
                        <Link href={`/dashboard/campaigns/${c.id}`} className="text-xs font-medium hover:underline" style={{ color: "var(--accent)" }}>View</Link>
                        {c.status === "running" || c.status === "scheduled" ? (
                          <button onClick={() => action(c.id, "pause")} className="text-xs font-medium hover:underline" style={{ color: "#ea580c" }}>Pause</button>
                        ) : c.status === "paused" ? (
                          <button onClick={() => action(c.id, "resume")} className="text-xs font-medium hover:underline" style={{ color: "var(--accent)" }}>Resume</button>
                        ) : null}
                        {["draft", "scheduled", "paused"].includes(c.status) && (
                          <button onClick={() => action(c.id, "cancel")} className="text-xs font-medium hover:underline" style={{ color: "#dc2626" }}>Cancel</button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {campaigns.length === 0 && (
                <tr><td colSpan={7} className="px-5 py-12 text-center" style={{ color: "var(--text-3)" }}>No campaigns yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
