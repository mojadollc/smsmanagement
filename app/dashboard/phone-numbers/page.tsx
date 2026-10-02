import { prisma } from "@/lib/prisma";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

export default async function PhoneNumbersPage() {
  const numbers = await prisma.twilioPhoneNumber.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Phone Numbers</h1>
      {numbers.length === 0 ? (
        <div className="bg-white border rounded-lg p-8 text-center text-gray-400">
          <p className="text-lg mb-2">No phone numbers configured</p>
          <p className="text-sm">Add your Twilio numbers to the database to manage them here.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {numbers.map((n) => (
            <div key={n.id} className="bg-white border rounded-lg p-5">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-lg font-semibold">{n.phoneNumber}</p>
                  <p className="text-sm text-gray-500">SID: {n.twilioSid}</p>
                  {n.messagingServiceSid && (
                    <p className="text-sm text-gray-500">Messaging Service: {n.messagingServiceSid}</p>
                  )}
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${n.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                  {n.status}
                </span>
              </div>
              <div className="mt-3 flex gap-4 text-sm">
                <span className={n.smsEnabled ? "text-green-600" : "text-gray-400"}>SMS: {n.smsEnabled ? "✓ Enabled" : "Disabled"}</span>
                <span className={n.mmsEnabled ? "text-green-600" : "text-gray-400"}>MMS: {n.mmsEnabled ? "✓ Enabled" : "Disabled"}</span>
              </div>
              <p className="text-xs text-gray-400 mt-2">Added {format(new Date(n.createdAt), "MMM d, yyyy")}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
