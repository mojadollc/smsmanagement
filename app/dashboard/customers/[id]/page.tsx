import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      conversations: {
        include: { messages: { orderBy: { createdAt: "asc" } } },
        orderBy: { lastMessageAt: "desc" },
      },
      optInRecords: { orderBy: { createdAt: "desc" }, take: 5 },
    },
  });

  if (!customer) notFound();

  const allMessages = customer.conversations.flatMap((c) => c.messages);

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/customers" className="text-sm text-blue-600">← Customers</Link>
      </div>

      <div className="bg-white border rounded-lg p-5">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-xl font-bold">{customer.firstName} {customer.lastName}</h1>
            <p className="text-gray-500">{customer.phone}</p>
            {customer.email && <p className="text-gray-500 text-sm">{customer.email}</p>}
          </div>
          <div className="text-right">
            {customer.smsOptOut ? (
              <span className="bg-red-100 text-red-700 text-sm px-3 py-1 rounded-full">🚫 Opted Out</span>
            ) : customer.smsOptIn ? (
              <span className="bg-green-100 text-green-700 text-sm px-3 py-1 rounded-full">✓ Opted In</span>
            ) : (
              <span className="bg-gray-100 text-gray-600 text-sm px-3 py-1 rounded-full">No consent</span>
            )}
          </div>
        </div>
        <div className="mt-3 text-xs text-gray-400">
          Customer since {format(new Date(customer.createdAt), "MMM d, yyyy")}
        </div>
      </div>

      <div className="bg-white border rounded-lg p-5">
        <h2 className="font-semibold mb-3">Message History ({allMessages.length})</h2>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {allMessages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.direction === "outbound" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-sm px-3 py-2 rounded-lg text-sm ${msg.direction === "outbound" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-800"}`}>
                <p>{msg.body}</p>
                <p className={`text-xs mt-1 ${msg.direction === "outbound" ? "text-blue-200" : "text-gray-400"}`}>
                  {format(new Date(msg.createdAt), "MMM d, h:mm a")} · {msg.status}
                </p>
              </div>
            </div>
          ))}
          {allMessages.length === 0 && <p className="text-sm text-gray-400">No messages yet</p>}
        </div>
      </div>

      {customer.optInRecords.length > 0 && (
        <div className="bg-white border rounded-lg p-5">
          <h2 className="font-semibold mb-3">Opt-In/Out History</h2>
          <div className="space-y-1">
            {customer.optInRecords.map((r) => (
              <div key={r.id} className="flex justify-between text-sm">
                <span className={r.type === "STOP" ? "text-red-600" : r.type === "START" ? "text-green-600" : "text-gray-600"}>
                  {r.type}
                </span>
                <span className="text-gray-400">{format(new Date(r.createdAt), "MMM d, yyyy h:mm a")}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
