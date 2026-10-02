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

const statusColor: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600",
  scheduled: "bg-blue-100 text-blue-700",
  running: "bg-yellow-100 text-yellow-700",
  completed: "bg-green-100 text-green-700",
  paused: "bg-orange-100 text-orange-700",
  cancelled: "bg-red-100 text-red-700",
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
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Campaigns</h2>
        <Link href="/dashboard/campaigns/new" className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm">
          + New Campaign
        </Link>
      </div>
      <div className="bg-white border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Campaign</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Total</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Sent</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Delivered</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Failed</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map((c) => (
              <tr key={c.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{c.name}</td>
                <td className="px-4 py-3">{c.totalCount}</td>
                <td className="px-4 py-3">{c.sent}</td>
                <td className="px-4 py-3 text-green-600">{c.delivered}</td>
                <td className="px-4 py-3 text-red-600">{c.failed}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColor[c.status] ?? "bg-gray-100"}`}>
                    {c.status}
                  </span>
                </td>
                <td className="px-4 py-3 flex gap-2">
                  {c.status === "running" || c.status === "scheduled" ? (
                    <button onClick={() => action(c.id, "pause")} className="text-xs text-orange-600 hover:underline">Pause</button>
                  ) : c.status === "paused" ? (
                    <button onClick={() => action(c.id, "resume")} className="text-xs text-blue-600 hover:underline">Resume</button>
                  ) : null}
                  {["draft", "scheduled", "paused"].includes(c.status) && (
                    <button onClick={() => action(c.id, "cancel")} className="text-xs text-red-600 hover:underline">Cancel</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
