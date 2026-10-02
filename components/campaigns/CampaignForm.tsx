"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Customer { id: string; firstName: string; lastName: string; phone: string; }
interface Group { id: string; name: string; memberCount: number; }
interface ScheduleSlot { time: string; count: number; }
interface SendingMethods { immediate: boolean; batch: boolean; }

export default function CampaignForm() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [adminDailyLimit, setAdminDailyLimit] = useState(200);
  const [sendingMethods, setSendingMethods] = useState<SendingMethods>({ immediate: true, batch: true });
  const [sendMethod, setSendMethod] = useState<"immediate" | "batch" | null>(null);
  const [schedules, setSchedules] = useState<ScheduleSlot[]>([{ time: "09:00", count: 50 }]);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [selectionMode, setSelectionMode] = useState<"individual" | "groups">("groups");

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        if (!d) return;
        if (d.dailyLimit) setAdminDailyLimit(d.dailyLimit);
        const methods: SendingMethods = d.sendingMethods ?? { immediate: true, batch: true };
        setSendingMethods(methods);
        if (methods.batch) setSendMethod("batch");
        else if (methods.immediate) setSendMethod("immediate");
      });

    fetch("/api/customers?limit=500")
      .then((r) => r.json())
      .then((d) => setCustomers(d.customers ?? []));

    fetch("/api/groups")
      .then((r) => r.ok ? r.json() : [])
      .then((d) => setGroups(d));
  }, []);

  // Update selected customers when groups change
  useEffect(() => {
    if (selectionMode === "groups" && selectedGroups.length > 0) {
      // Fetch member IDs for selected groups
      Promise.all(
        selectedGroups.map(gid => fetch(`/api/groups/${gid}`).then(r => r.ok ? r.json() : null))
      ).then(results => {
        const allCustomerIds = new Set<string>();
        results.forEach(g => {
          if (g?.members) g.members.forEach((m: Customer) => allCustomerIds.add(m.id));
        });
        setSelected(Array.from(allCustomerIds));
      });
    }
  }, [selectedGroups, selectionMode]);

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
    if (field === "count") {
      const newTotal = updated.reduce((s, slot) => s + slot.count, 0);
      if (newTotal > adminDailyLimit) return;
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
    if (!selected.length) return alert("Select at least one recipient");
    if (!sendMethod) return alert("Select a sending method");
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
      await fetch(`/api/campaigns/${campaign.id}/schedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schedules: sendMethod === "batch"
            ? schedules
            : [{ time: new Date().toTimeString().slice(0, 5), count: selected.length }],
        }),
      });
      router.push("/dashboard/campaigns");
    }
    setSubmitting(false);
  }

  const pct = Math.min(100, Math.round((totalScheduled / adminDailyLimit) * 100));
  const enabledCount = (sendingMethods.immediate ? 1 : 0) + (sendingMethods.batch ? 1 : 0);
  const noMethodsEnabled = enabledCount === 0;

  const methodOptions = [
    {
      id: "immediate" as const,
      label: "Send Immediately",
      desc: "Send all at once right now",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      iconBg: "rgba(234,179,8,0.12)",
      iconColor: "#ca8a04",
    },
    {
      id: "batch" as const,
      label: "Batch / Drip",
      desc: "Spread across the day (recommended)",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      iconBg: "rgba(59,130,246,0.12)",
      iconColor: "#2563eb",
    },
  ];

  return (
    <form onSubmit={submit} className="max-w-2xl space-y-5">

      {/* Campaign Details */}
      <div className="card p-5 space-y-4" style={{ background: "var(--bg-card)" }}>
        <h2 className="font-semibold" style={{ color: "var(--text)" }}>Campaign Details</h2>
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-2)" }}>Campaign Name</label>
          <input
            required
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="October Customer Follow-up"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-2)" }}>Message</label>
          <textarea
            required
            rows={3}
            className="input resize-none"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Hi {{first_name}}, how are you?"
          />
          <div className="flex justify-between mt-1">
            <p className="text-xs" style={{ color: "var(--text-3)" }}>Use {"{{first_name}}"} for personalization</p>
            <p className="text-xs" style={{ color: message.length > 160 ? "#dc2626" : "var(--text-3)" }}>{message.length}/160</p>
          </div>
        </div>
      </div>

      {/* Recipients */}
      <div className="card p-5" style={{ background: "var(--bg-card)" }}>
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-semibold" style={{ color: "var(--text)" }}>Recipients</h2>
          <span className="text-sm font-medium" style={{ color: "var(--accent)" }}>{selected.length} selected</span>
        </div>

        {/* Mode Toggle */}
        <div className="flex gap-2 mb-3">
          <button
            type="button"
            onClick={() => { setSelectionMode("groups"); setSelected([]); }}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${selectionMode === "groups" ? "" : ""}`}
            style={{
              background: selectionMode === "groups" ? "var(--accent)" : "var(--bg-subtle)",
              color: selectionMode === "groups" ? "white" : "var(--text-2)",
            }}
          >
            Select by Group
          </button>
          <button
            type="button"
            onClick={() => { setSelectionMode("individual"); setSelectedGroups([]); setSelected([]); }}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all`}
            style={{
              background: selectionMode === "individual" ? "var(--accent)" : "var(--bg-subtle)",
              color: selectionMode === "individual" ? "white" : "var(--text-2)",
            }}
          >
            Individual Customers
          </button>
        </div>

        {/* Group Selection */}
        {selectionMode === "groups" && groups.length > 0 && (
          <div className="space-y-2 mb-3">
            {groups.map(g => {
              const isSelected = selectedGroups.includes(g.id);
              return (
                <label
                  key={g.id}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all"
                  style={{
                    background: isSelected ? "var(--accent-soft)" : "var(--bg-subtle)",
                    border: `2px solid ${isSelected ? "var(--accent)" : "transparent"}`,
                  }}
                >
                  <input
                    type="checkbox"
                    className="rounded"
                    checked={isSelected}
                    onChange={(e) => setSelectedGroups(e.target.checked ? [...selectedGroups, g.id] : selectedGroups.filter(id => id !== g.id))}
                  />
                  <span className="font-medium text-sm" style={{ color: "var(--text)" }}>{g.name}</span>
                  <span className="text-xs ml-auto" style={{ color: "var(--text-3)" }}>{g.memberCount} members</span>
                </label>
              );
            })}
          </div>
        )}

        {/* Individual Selection */}
        {selectionMode === "individual" && (
          <>
            <input
              className="input mb-2"
              placeholder="Search customers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="rounded-lg overflow-hidden" style={{ border: "1px solid var(--border)" }}>
              <div className="px-3 py-2 flex gap-3" style={{ background: "var(--bg-subtle)", borderBottom: "1px solid var(--border)" }}>
                <button type="button" className="text-xs font-medium" style={{ color: "var(--accent)" }} onClick={() => setSelected(customers.map((c) => c.id))}>
                  Select All ({customers.length})
                </button>
                <button type="button" className="text-xs" style={{ color: "var(--text-3)" }} onClick={() => setSelected([])}>Clear</button>
              </div>
              <div className="max-h-44 overflow-y-auto">
                {filteredCustomers.map((c) => (
                  <label
                    key={c.id}
                    className="flex items-center gap-3 px-3 py-2 cursor-pointer text-sm"
                    style={{ borderBottom: "1px solid var(--border-soft)" }}
                  >
                    <input
                      type="checkbox"
                      className="rounded"
                      checked={selected.includes(c.id)}
                      onChange={(e) => setSelected(e.target.checked ? [...selected, c.id] : selected.filter((id) => id !== c.id))}
                    />
                    <span className="font-medium" style={{ color: "var(--text)" }}>{c.firstName} {c.lastName}</span>
                    <span className="text-xs ml-auto" style={{ color: "var(--text-3)" }}>{c.phone}</span>
                  </label>
                ))}
              </div>
            </div>
          </>
        )}

        {selectionMode === "groups" && groups.length === 0 && (
          <div className="text-center py-6 rounded-lg" style={{ background: "var(--bg-subtle)" }}>
            <p className="text-sm mb-2" style={{ color: "var(--text-2)" }}>No groups created yet</p>
            <a href="/dashboard/groups" className="text-sm font-medium" style={{ color: "var(--accent)" }}>Create a group →</a>
          </div>
        )}
      </div>

      {/* Sending Method */}
      <div className="card p-5 space-y-4" style={{ background: "var(--bg-card)" }}>
        <h2 className="font-semibold" style={{ color: "var(--text)" }}>Sending Method</h2>

        {noMethodsEnabled ? (
          <div
            className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm"
            style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#dc2626" }}
          >
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            No sending methods are enabled. Contact your administrator.
          </div>
        ) : (
          <div className={`grid gap-3 ${enabledCount === 2 ? "grid-cols-2" : "grid-cols-1"}`}>
            {methodOptions
              .filter((m) => sendingMethods[m.id])
              .map((m) => {
                const active = sendMethod === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSendMethod(m.id)}
                    className="text-left p-4 rounded-xl transition-all"
                    style={{
                      border: `2px solid ${active ? "var(--accent)" : "var(--border)"}`,
                      background: active ? "var(--accent-soft)" : "var(--bg-subtle)",
                    }}
                  >
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center mb-2"
                      style={{ background: m.iconBg, color: m.iconColor }}
                    >
                      {m.icon}
                    </div>
                    <p className="text-sm font-semibold" style={{ color: active ? "var(--accent-text)" : "var(--text)" }}>{m.label}</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>{m.desc}</p>
                  </button>
                );
              })}
          </div>
        )}

        {sendMethod === "batch" && (
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm"
            style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", color: "#16a34a" }}
          >
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Recommended — avoids carrier spam filters and looks natural
          </div>
        )}
      </div>

      {/* Batch schedule */}
      {sendMethod === "batch" && (
        <div className="card p-5 space-y-4" style={{ background: "var(--bg-card)" }}>
          <div className="flex justify-between items-center">
            <h2 className="font-semibold" style={{ color: "var(--text)" }}>Batch Schedule</h2>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: "var(--bg-subtle)" }}>
              <span className="text-xs" style={{ color: "var(--text-3)" }}>Daily limit:</span>
              <span className="text-sm font-bold" style={{ color: "var(--text)" }}>{adminDailyLimit}</span>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span style={{ color: "var(--text-2)" }}>Scheduled: <span className="font-semibold" style={{ color: "var(--text)" }}>{totalScheduled}</span></span>
              <span style={{ color: isOverLimit ? "#dc2626" : "var(--text-2)" }}>
                Remaining: <span className="font-semibold">{Math.max(0, adminDailyLimit - totalScheduled)}</span>
              </span>
            </div>
            <div className="w-full rounded-full h-2" style={{ background: "var(--bg-subtle)" }}>
              <div
                className="h-2 rounded-full transition-all"
                style={{ width: `${Math.min(100, pct)}%`, background: isOverLimit ? "#ef4444" : pct > 80 ? "#f59e0b" : "#3b82f6" }}
              />
            </div>
            {isOverLimit && (
              <p className="text-xs mt-1.5 font-medium" style={{ color: "#dc2626" }}>
                ⚠ Total exceeds the daily limit of {adminDailyLimit}. Reduce counts to proceed.
              </p>
            )}
          </div>

          <div className="space-y-2">
            {schedules.map((slot, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-lg" style={{ background: "var(--bg-subtle)" }}>
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-xs font-medium w-8" style={{ color: "var(--text-3)" }}>Time</span>
                  <input
                    type="time"
                    className="input w-auto px-2 py-1.5 text-sm"
                    value={slot.time}
                    onChange={(e) => updateSlot(i, "time", e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium" style={{ color: "var(--text-3)" }}>SMS</span>
                  <input
                    type="number"
                    min={1}
                    max={adminDailyLimit}
                    className="input w-20 px-2 py-1.5 text-sm"
                    value={slot.count}
                    onChange={(e) => updateSlot(i, "count", Number(e.target.value))}
                  />
                </div>
                <button type="button" onClick={() => removeSlot(i)} className="p-1 rounded transition-colors" style={{ color: "var(--text-3)" }}>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addSlot}
            disabled={!canAddSlot}
            className="w-full py-2.5 rounded-lg text-sm font-medium border-2 border-dashed transition-all"
            style={{
              borderColor: canAddSlot ? "var(--accent)" : "var(--border)",
              color: canAddSlot ? "var(--accent)" : "var(--text-3)",
              cursor: canAddSlot ? "pointer" : "not-allowed",
            }}
          >
            {canAddSlot ? "+ Add Time Slot" : `Daily limit of ${adminDailyLimit} reached`}
          </button>
        </div>
      )}

      <button
        type="submit"
        disabled={submitting || noMethodsEnabled || !sendMethod || (sendMethod === "batch" && isOverLimit) || !selected.length}
        className="btn-primary w-full py-3 text-sm font-semibold"
      >
        {submitting ? "Creating Campaign..." : "Create Campaign"}
      </button>
    </form>
  );
}
