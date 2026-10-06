"use client";

import { useState, useEffect } from "react";

interface Customer { id: string; firstName: string; lastName: string; phone: string; }

export default function SendSmsForm() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [immediateEnabled, setImmediateEnabled] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        const methods = d?.sendingMethods ?? { immediate: true, batch: true };
        setImmediateEnabled(methods.immediate ?? true);
      });
    fetch("/api/customers?limit=500").then((r) => r.json()).then((d) => setCustomers(d.customers ?? []));
  }, []);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    const res = await fetch("/api/messages/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customerId, message }),
    });
    setStatus(res.ok ? "sent" : "error");
    if (res.ok) { setMessage(""); setCustomerId(""); }
  }

  const selected = customers.find((c) => c.id === customerId);

  if (immediateEnabled === null) {
    return <div className="text-sm" style={{ color: "var(--text-3)" }}>Loading...</div>;
  }

  if (!immediateEnabled) {
    return (
      <div className="max-w-lg flex items-start gap-3 px-4 py-4 rounded-xl"
        style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
        <svg className="w-5 h-5 shrink-0 mt-0.5" style={{ color: "#dc2626" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
        </svg>
        <div>
          <p className="font-semibold text-sm" style={{ color: "#dc2626" }}>Send Immediately is disabled</p>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-2)" }}>
            This sending method has been disabled by your administrator. Use Campaigns with Batch / Drip instead.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={send} className="max-w-lg space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-2)" }}>Customer</label>
        <select required className="input" value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
          <option value="">Select customer...</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>{c.firstName} {c.lastName} · {c.phone}</option>
          ))}
        </select>
      </div>

      {selected && (
        <div className="px-3 py-2 rounded-lg text-sm" style={{ background: "var(--bg-subtle)", color: "var(--text-2)" }}>
          {selected.firstName} {selected.lastName} · {selected.phone}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-2)" }}>Message</label>
        <textarea
          required
          rows={4}
          className="input resize-none"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Hi, are you still interested?"
        />
        <p className="text-xs mt-1" style={{ color: message.length > 160 ? "#dc2626" : "var(--text-3)" }}>{message.length}/160</p>
      </div>

      <button type="submit" disabled={status === "sending"} className="btn-primary w-full py-2.5">
        {status === "sending" ? "Sending..." : "Send SMS"}
      </button>

      {status === "sent" && (
        <div className="flex items-center gap-2 text-sm" style={{ color: "#16a34a" }}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Message sent successfully
        </div>
      )}
      {status === "error" && (
        <p className="text-sm" style={{ color: "#dc2626" }}>Failed to send. Check opt-out status.</p>
      )}
    </form>
  );
}
