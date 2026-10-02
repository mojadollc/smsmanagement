"use client";

import { useState, useEffect } from "react";

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
}

export default function SendSmsForm() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  useEffect(() => {
    fetch("/api/customers?limit=500").then((r) => r.json()).then((d) => setCustomers(d.customers));
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

  return (
    <form onSubmit={send} className="max-w-lg space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Customer</label>
        <select required className="w-full border rounded-md px-3 py-2 text-sm" value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
          <option value="">Select customer...</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>{c.firstName} {c.lastName} · {c.phone}</option>
          ))}
        </select>
      </div>

      {selected && (
        <div className="bg-gray-50 rounded-md px-3 py-2 text-sm text-gray-600">
          {selected.firstName} {selected.lastName} · {selected.phone}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-1">Message</label>
        <textarea required rows={4} className="w-full border rounded-md px-3 py-2 text-sm" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Hi, are you still interested?" />
        <p className="text-xs text-gray-400 mt-1">{message.length}/160</p>
      </div>

      <button type="submit" disabled={status === "sending"} className="w-full bg-blue-600 text-white py-2.5 rounded-md font-medium disabled:opacity-50">
        {status === "sending" ? "Sending..." : "Send SMS"}
      </button>

      {status === "sent" && <p className="text-green-600 text-sm text-center">✓ Message sent</p>}
      {status === "error" && <p className="text-red-600 text-sm text-center">Failed to send. Check opt-out status.</p>}
    </form>
  );
}
