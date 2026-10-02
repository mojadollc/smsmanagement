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

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Reports</h1>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border rounded-lg p-5">
          <h2 className="font-semibold mb-4">All Time</h2>
          <div className="space-y-3">
            {[
              { label: "Total Sent", value: totalSent },
              { label: "Delivered", value: totalDelivered, color: "text-green-600" },
              { label: "Failed / Undelivered", value: totalFailed, color: "text-red-600" },
              { label: "Opt-Outs", value: totalOptOuts, color: "text-orange-600" },
              { label: "Delivery Rate", value: `${deliveryRate}%`, color: "text-blue-600" },
            ].map((row) => (
              <div key={row.label} className="flex justify-between text-sm">
                <span className="text-gray-600">{row.label}</span>
                <span className={`font-semibold ${row.color ?? ""}`}>{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border rounded-lg p-5">
          <h2 className="font-semibold mb-4">Today</h2>
          <div className="space-y-3">
            {[
              { label: "Sent", value: sentToday },
              { label: "Delivered", value: deliveredToday, color: "text-green-600" },
              { label: "Remaining Limit", value: Math.max(0, 200 - sentToday), color: "text-blue-600" },
            ].map((row) => (
              <div key={row.label} className="flex justify-between text-sm">
                <span className="text-gray-600">{row.label}</span>
                <span className={`font-semibold ${row.color ?? ""}`}>{row.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white border rounded-lg overflow-hidden">
        <div className="p-4 border-b font-semibold">Campaign Performance</div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Campaign</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Total</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Sent</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Delivered</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Failed</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Opt-Outs</th>
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
                <td className="px-4 py-3 text-orange-600">{c.optedOut}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
