import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [totalSent, totalDelivered, totalFailed, totalOptOuts, sentToday, deliveredToday, campaigns] =
    await Promise.all([
      prisma.message.count({ where: { direction: "outbound" } }),
      prisma.message.count({ where: { direction: "outbound", status: "delivered" } }),
      prisma.message.count({ where: { direction: "outbound", status: { in: ["failed", "undelivered"] } } }),
      prisma.customer.count({ where: { smsOptOut: true } }),
      prisma.message.count({ where: { direction: "outbound", createdAt: { gte: today } } }),
      prisma.message.count({ where: { direction: "outbound", status: "delivered", createdAt: { gte: today } } }),
      prisma.campaign.findMany({ orderBy: { createdAt: "desc" }, take: 10 }),
    ]);

  const deliveryRate = totalSent > 0 ? Math.round((totalDelivered / totalSent) * 100) : 0;

  const allTimeRows = [
    { label: "Total Sent",           value: totalSent,      color: "var(--text)" },
    { label: "Delivered",            value: totalDelivered, color: "#16a34a" },
    { label: "Failed / Undelivered", value: totalFailed,    color: "#dc2626" },
    { label: "Opt-Outs",             value: totalOptOuts,   color: "#ea580c" },
    { label: "Delivery Rate",        value: `${deliveryRate}%`, color: "#2563eb" },
  ];

  const todayRows = [
    { label: "Sent",            value: sentToday,                    color: "var(--text)" },
    { label: "Delivered",       value: deliveredToday,               color: "#16a34a" },
    { label: "Remaining Limit", value: Math.max(0, 200 - sentToday), color: "#2563eb" },
  ];

  const statusColors: Record<string, { bg: string; text: string }> = {
    running:   { bg: "rgba(234,179,8,0.12)",  text: "#ca8a04" },
    scheduled: { bg: "rgba(59,130,246,0.12)", text: "#2563eb" },
    completed: { bg: "rgba(34,197,94,0.12)",  text: "#16a34a" },
    paused:    { bg: "rgba(148,163,184,0.12)", text: "#64748b" },
    cancelled: { bg: "rgba(239,68,68,0.12)",  text: "#dc2626" },
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>Reports</h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--text-2)" }}>SMS delivery analytics and campaign performance</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="card p-5" style={{ background: "var(--bg-card)" }}>
          <h2 className="font-semibold mb-4" style={{ color: "var(--text)" }}>All Time</h2>
          <div className="space-y-3">
            {allTimeRows.map((row) => (
              <div key={row.label} className="flex justify-between items-center text-sm">
                <span style={{ color: "var(--text-2)" }}>{row.label}</span>
                <span className="font-semibold" style={{ color: row.color }}>{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5" style={{ background: "var(--bg-card)" }}>
          <h2 className="font-semibold mb-4" style={{ color: "var(--text)" }}>Today</h2>
          <div className="space-y-3">
            {todayRows.map((row) => (
              <div key={row.label} className="flex justify-between items-center text-sm">
                <span style={{ color: "var(--text-2)" }}>{row.label}</span>
                <span className="font-semibold" style={{ color: row.color }}>{row.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card overflow-hidden" style={{ background: "var(--bg-card)" }}>
        <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
          <h2 className="font-semibold" style={{ color: "var(--text)" }}>Campaign Performance</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-subtle)" }}>
                {["Campaign", "Total", "Sent", "Delivered", "Failed", "Opt-Outs", "Status"].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-3)" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {campaigns.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-sm" style={{ color: "var(--text-3)" }}>
                    No campaigns yet
                  </td>
                </tr>
              ) : campaigns.map((c) => {
                const sc = statusColors[c.status] ?? statusColors.paused;
                return (
                  <tr key={c.id} style={{ borderBottom: "1px solid var(--border-soft)" }}>
                    <td className="px-5 py-3 font-medium" style={{ color: "var(--text)" }}>{c.name}</td>
                    <td className="px-5 py-3" style={{ color: "var(--text-2)" }}>{c.totalCount}</td>
                    <td className="px-5 py-3" style={{ color: "var(--text-2)" }}>{c.sent}</td>
                    <td className="px-5 py-3 font-medium" style={{ color: "#16a34a" }}>{c.delivered}</td>
                    <td className="px-5 py-3 font-medium" style={{ color: "#dc2626" }}>{c.failed}</td>
                    <td className="px-5 py-3 font-medium" style={{ color: "#ea580c" }}>{c.optedOut}</td>
                    <td className="px-5 py-3">
                      <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: sc.bg, color: sc.text }}>
                        {c.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
