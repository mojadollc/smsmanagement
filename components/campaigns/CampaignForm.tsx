"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Customer { id: string; firstName: string; lastName: string; phone: string; }
interface ScheduleSlot { time: string; count: number; }

export default function CampaignForm() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [adminDailyLimit, setAdminDailyLimit] = useState(200); // from admin settings
  const [sendMethod, setSendMethod] = useState<"immediate" | "batch">("batch");
  const [schedules, setSchedules] = useState<ScheduleSlot[]>([{ time: "09:00", count: 50 }]);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    // Load admin daily limit from settings
    fetch("/api/settings")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d?.dailyLimit) setAdminDailyLimit(d.dailyLimit); });

    fetch("/api/customers?limit=500")
      .then((r) => r.json())
      .then((d) => setCustomers(d.customers ?? []));
  }, []);

  const totalScheduled = schedules.reduce((s, slot) => s + slot.count, 0);
  const isOverLimit = totalScheduled > adminDailyLimit;
  const canAddSlot = totalScheduled < adminDailyLimit;

  function addSlot() {
    const remaining = adminDailyLimit - totalScheduled;
    if (remaining <= 0) return;
    setSchedules([...schedules, { time: "10:00", count: Math.min(30, remaining) }]);
  }

  function updateSlot(i: number, field: keyof ScheduleSlot, value: string | number) {
    const updated = schedules.map((s, idx) => (idx === i ? { ...s, [field]: value } : s));
    // Enforce: single slot count cannot exceed adminDailyLimit
    if (field === "count") {
      const newTotal = updated.reduce((s, slot) => s + slot.count, 0);
      if (newTotal > adminDailyLimit) return; // block the update
    }
    setSchedules(updated);
  }

  function removeSlot(i: number) {
    setSchedules(schedules.filter((_, idx) => idx !== i));
  }

  const filteredCustomers = customers.filter((c) =>
    `${c.firstName} ${c.lastName} ${c.phone}`.toLowerCase().includes(search.toLowerCase())
  );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected.length) return alert("Select at least one customer");
    if (sendMethod === "batch" && isOverLimit) return;
    setSubmitting(true);

    const res = await fetch("/api/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        message,
        customerIds: selected,
        dailyLimit: adminDailyLimit,
        schedules: sendMethod === "batch" ? schedules : null,
      }),
    });

    if (res.ok) {
      const campaign = await res.json();
      if (sendMethod === "batch") {
        await fetch(`/api/campaigns/${campaign.id}/schedule`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ schedules }),
        });
      } else {
        // immediate: schedule all for now
        await fetch(`/api/campaigns/${campaign.id}/schedule`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ schedules: [{ time: new Date().toTimeString().slice(0, 5), count: selected.length }] }),
        });
      }
      router.push("/dashboard/campaigns");
    }
    setSubmitting(false);
  }

  const pct = Math.min(100, Math.round((totalScheduled / adminDailyLimit) * 100));

  return (
    <form onSubmit={submit} className="max-w-2xl space-y-6">

      {/* Campaign Name */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <h2 className="font-semibold text-gray-900">Campaign Details</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Campaign Name</label>
          <input
            required
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="October Customer Follow-up"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Message</label>
          <textarea
            required
            rows={3}
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Hi {{first_name}}, how are you?"
          />
          <div className="flex justify-between mt-1">
            <p className="text-xs text-gray-400">Use {"{{first_name}}"} for personalization</p>
            <p className={`text-xs ${message.length > 160 ? "text-red-500" : "text-gray-400"}`}>{message.length}/160</p>
          </div>
        </div>
      </div>

      {/* Recipients */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-semibold text-gray-900">Recipients</h2>
          <span className="text-sm text-blue-600 font-medium">{selected.length} selected</span>
        </div>
        <input
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Search customers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-3 py-2 bg-gray-50 border-b flex gap-3">
            <button type="button" className="text-xs text-blue-600 font-medium" onClick={() => setSelected(customers.map((c) => c.id))}>Select All ({customers.length})</button>
            <button type="button" className="text-xs text-gray-400" onClick={() => setSelected([])}>Clear</button>
          </div>
          <div className="max-h-44 overflow-y-auto">
            {filteredCustomers.map((c) => (
              <label key={c.id} className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm border-b border-gray-50 last:border-0">
                <input
                  type="checkbox"
                  className="rounded"
                  checked={selected.includes(c.id)}
                  onChange={(e) => setSelected(e.target.checked ? [...selected, c.id] : selected.filter((id) => id !== c.id))}
                />
                <span className="font-medium text-gray-900">{c.firstName} {c.lastName}</span>
                <span className="text-gray-400 text-xs ml-auto">{c.phone}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Sending Method */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <h2 className="font-semibold text-gray-900">Sending Method</h2>

        <div className="grid grid-cols-2 gap-3">
          {([
            { id: "immediate", label: "Send Immediately", desc: "Send all at once right now", icon: "⚡" },
            { id: "batch", label: "Batch / Drip", desc: "Spread across the day (recommended)", icon: "📅" },
          ] as const).map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setSendMethod(m.id)}
              className={`text-left p-4 rounded-xl border-2 transition-all ${
                sendMethod === m.id
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="text-xl mb-1">{m.icon}</div>
              <p className={`text-sm font-semibold ${sendMethod === m.id ? "text-blue-700" : "text-gray-900"}`}>{m.label}</p>
              <p className="text-xs text-gray-500 mt-0.5">{m.desc}</p>
            </button>
          ))}
        </div>

        {/* Recommended badge */}
        {sendMethod === "batch" && (
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-sm text-green-700">
            <span>✓</span>
            <span>Recommended — avoids carrier spam filters and looks natural</span>
          </div>
        )}
      </div>

      {/* Batch schedule */}
      {sendMethod === "batch" && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="font-semibold text-gray-900">Batch Schedule</h2>
            {/* Admin limit badge — read only */}
            <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-1.5">
              <span className="text-xs text-gray-500">Admin daily limit:</span>
              <span className="text-sm font-bold text-gray-900">{adminDailyLimit}</span>
            </div>
          </div>

          {/* Progress bar */}
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-gray-500">Scheduled: <span className="font-semibold text-gray-900">{totalScheduled}</span></span>
              <span className={isOverLimit ? "text-red-600 font-semibold" : "text-gray-500"}>
                Remaining: <span className="font-semibold">{Math.max(0, adminDailyLimit - totalScheduled)}</span>
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${isOverLimit ? "bg-red-500" : pct > 80 ? "bg-yellow-500" : "bg-blue-500"}`}
                style={{ width: `${Math.min(100, pct)}%` }}
              />
            </div>
            {isOverLimit && (
              <p className="text-xs text-red-600 mt-1.5 font-medium">
                ⚠ Total exceeds the admin daily limit of {adminDailyLimit}. Reduce counts to proceed.
              </p>
            )}
          </div>

          {/* Schedule slots */}
          <div className="space-y-2">
            {schedules.map((slot, i) => (
              <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-lg px-3 py-2.5">
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-xs font-medium text-gray-500 w-8">Time</span>
                  <input
                    type="time"
                    className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={slot.time}
                    onChange={(e) => updateSlot(i, "time", e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-500">SMS</span>
                  <input
                    type="number"
                    min={1}
                    max={adminDailyLimit}
                    className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm w-20 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={slot.count}
                    onChange={(e) => updateSlot(i, "count", Number(e.target.value))}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeSlot(i)}
                  className="text-gray-400 hover:text-red-500 transition-colors p-1"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>

          {/* Add time button — disabled when limit reached */}
          <button
            type="button"
            onClick={addSlot}
            disabled={!canAddSlot}
            className={`w-full py-2.5 rounded-lg text-sm font-medium border-2 border-dashed transition-all ${
              canAddSlot
                ? "border-blue-300 text-blue-600 hover:border-blue-400 hover:bg-blue-50"
                : "border-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            {canAddSlot ? "+ Add Time Slot" : `Daily limit of ${adminDailyLimit} reached — cannot add more slots`}
          </button>
        </div>
      )}

      <button
        type="submit"
        disabled={submitting || (sendMethod === "batch" && isOverLimit) || !selected.length}
        className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {submitting ? "Creating Campaign..." : "Create Campaign"}
      </button>
    </form>
  );
}
