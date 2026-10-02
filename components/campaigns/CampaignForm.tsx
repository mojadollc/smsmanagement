"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
}

interface ScheduleSlot {
  time: string;
  count: number;
}

export default function CampaignForm() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [dailyLimit, setDailyLimit] = useState(200);
  const [sendMethod, setSendMethod] = useState<"immediate" | "schedule" | "batch">("batch");
  const [schedules, setSchedules] = useState<ScheduleSlot[]>([{ time: "09:00", count: 50 }]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/customers?limit=500")
      .then((r) => r.json())
      .then((d) => setCustomers(d.customers));
  }, []);

  function addSlot() {
    setSchedules([...schedules, { time: "10:00", count: 30 }]);
  }

  function updateSlot(i: number, field: keyof ScheduleSlot, value: string | number) {
    setSchedules(schedules.map((s, idx) => (idx === i ? { ...s, [field]: value } : s)));
  }

  function removeSlot(i: number) {
    setSchedules(schedules.filter((_, idx) => idx !== i));
  }

  const totalScheduled = schedules.reduce((s, slot) => s + slot.count, 0);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected.length) return alert("Select at least one customer");
    setSubmitting(true);

    const res = await fetch("/api/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, message, customerIds: selected, dailyLimit, schedules }),
    });

    if (res.ok) {
      const campaign = await res.json();
      if (sendMethod !== "immediate") {
        await fetch(`/api/campaigns/${campaign.id}/schedule`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ schedules }),
        });
      }
      router.push("/dashboard/campaigns");
    }
    setSubmitting(false);
  }

  return (
    <form onSubmit={submit} className="max-w-2xl space-y-5">
      <div>
        <label className="block text-sm font-medium mb-1">Campaign Name</label>
        <input required className="w-full border rounded-md px-3 py-2 text-sm" value={name} onChange={(e) => setName(e.target.value)} placeholder="October Customer Follow-up" />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Message</label>
        <textarea required rows={3} className="w-full border rounded-md px-3 py-2 text-sm" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Hi {{first_name}}, how are you?" />
        <p className="text-xs text-gray-400 mt-1">{message.length}/160 chars · Use {"{{first_name}}"} for personalization</p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Recipients ({selected.length} selected)</label>
        <div className="border rounded-md max-h-40 overflow-y-auto">
          <div className="p-2 border-b bg-gray-50 flex gap-2">
            <button type="button" className="text-xs text-blue-600" onClick={() => setSelected(customers.map((c) => c.id))}>Select All</button>
            <button type="button" className="text-xs text-gray-500" onClick={() => setSelected([])}>Clear</button>
          </div>
          {customers.map((c) => (
            <label key={c.id} className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50 cursor-pointer text-sm">
              <input type="checkbox" checked={selected.includes(c.id)} onChange={(e) => setSelected(e.target.checked ? [...selected, c.id] : selected.filter((id) => id !== c.id))} />
              {c.firstName} {c.lastName} · {c.phone}
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Sending Method</label>
        <div className="space-y-1">
          {(["immediate", "schedule", "batch"] as const).map((m) => (
            <label key={m} className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="radio" checked={sendMethod === m} onChange={() => setSendMethod(m)} />
              {m === "immediate" ? "Send Immediately" : m === "schedule" ? "Schedule" : "Batch / Drip"}
            </label>
          ))}
        </div>
      </div>

      {sendMethod !== "immediate" && (
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-medium">Daily Maximum</label>
            <input type="number" className="border rounded px-2 py-1 text-sm w-24" value={dailyLimit} onChange={(e) => setDailyLimit(Number(e.target.value))} />
          </div>
          <table className="w-full text-sm border rounded-md overflow-hidden">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-3 py-2 font-medium">Time</th>
                <th className="text-left px-3 py-2 font-medium">SMS Count</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {schedules.map((slot, i) => (
                <tr key={i} className="border-t">
                  <td className="px-3 py-2">
                    <input type="time" className="border rounded px-2 py-1 text-sm" value={slot.time} onChange={(e) => updateSlot(i, "time", e.target.value)} />
                  </td>
                  <td className="px-3 py-2">
                    <input type="number" min={1} className="border rounded px-2 py-1 text-sm w-20" value={slot.count} onChange={(e) => updateSlot(i, "count", Number(e.target.value))} />
                  </td>
                  <td className="px-3 py-2">
                    <button type="button" onClick={() => removeSlot(i)} className="text-red-500 text-xs">Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex justify-between items-center mt-2">
            <button type="button" onClick={addSlot} className="text-sm text-blue-600">+ Add Time</button>
            <span className={`text-sm ${totalScheduled > dailyLimit ? "text-red-600" : "text-gray-500"}`}>
              Total: {totalScheduled} / {dailyLimit}
            </span>
          </div>
        </div>
      )}

      <button type="submit" disabled={submitting} className="w-full bg-blue-600 text-white py-2.5 rounded-md font-medium disabled:opacity-50">
        {submitting ? "Creating..." : "Schedule Campaign"}
      </button>
    </form>
  );
}
