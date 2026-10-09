"use client";

import { useState, useEffect, useRef } from "react";

interface Customer { id: string; firstName: string; lastName: string; phone: string; }

function CustomerDropdown({
  customers,
  value,
  onChange,
}: {
  customers: Customer[];
  value: string;
  onChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = customers.find(c => c.id === value);

  const filtered = query.trim()
    ? customers.filter(c =>
        `${c.firstName} ${c.lastName} ${c.phone}`.toLowerCase().includes(query.toLowerCase())
      )
    : customers;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function select(c: Customer) {
    onChange(c.id);
    setQuery("");
    setOpen(false);
  }

  function handleOpen() {
    setOpen(true);
    setQuery("");
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={handleOpen}
        className="input w-full flex items-center justify-between gap-2 text-left"
        style={{ minHeight: 42 }}
      >
        {selected ? (
          <span className="flex items-center gap-3 min-w-0">
            <span
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
              style={{ background: "var(--accent-subtle, rgba(59,130,246,0.12))", color: "var(--accent)" }}
            >
              {selected.firstName[0]?.toUpperCase()}
            </span>
            <span className="min-w-0">
              <span className="font-medium block truncate" style={{ color: "var(--text)" }}>
                {selected.firstName} {selected.lastName}
              </span>
              <span className="text-xs block" style={{ color: "var(--text-3)" }}>{selected.phone}</span>
            </span>
          </span>
        ) : (
          <span style={{ color: "var(--text-3)" }}>Select a customer...</span>
        )}
        <svg
          className="w-4 h-4 shrink-0 transition-transform"
          style={{ color: "var(--text-3)", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute z-50 w-full mt-1 rounded-xl overflow-hidden"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
          }}
        >
          {/* Search */}
          <div className="p-2" style={{ borderBottom: "1px solid var(--border)" }}>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: "var(--bg-subtle)" }}>
              <svg className="w-4 h-4 shrink-0" style={{ color: "var(--text-3)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
              </svg>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search by name or phone..."
                className="flex-1 bg-transparent outline-none text-sm"
                style={{ color: "var(--text)" }}
              />
              {query && (
                <button type="button" onClick={() => setQuery("")}>
                  <svg className="w-3.5 h-3.5" style={{ color: "var(--text-3)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* List */}
          <ul className="overflow-y-auto" style={{ maxHeight: 260 }}>
            {filtered.length === 0 ? (
              <li className="px-4 py-6 text-sm text-center" style={{ color: "var(--text-3)" }}>No customers found</li>
            ) : (
              filtered.map(c => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => select(c)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors"
                    style={{
                      background: c.id === value ? "rgba(59,130,246,0.08)" : "transparent",
                    }}
                    onMouseEnter={e => { if (c.id !== value) (e.currentTarget as HTMLElement).style.background = "var(--bg-subtle)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = c.id === value ? "rgba(59,130,246,0.08)" : "transparent"; }}
                  >
                    <span
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                      style={{ background: "rgba(59,130,246,0.12)", color: "#3b82f6" }}
                    >
                      {c.firstName[0]?.toUpperCase()}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block font-medium text-sm" style={{ color: "var(--text)" }}>
                        {c.firstName} {c.lastName}
                        {c.id === value && (
                          <svg className="w-3.5 h-3.5 inline ml-2" style={{ color: "#3b82f6" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </span>
                      <span className="block text-xs mt-0.5" style={{ color: "var(--text-3)" }}>{c.phone}</span>
                    </span>
                  </button>
                </li>
              ))
            )}
          </ul>

          {filtered.length > 0 && (
            <div className="px-4 py-2 text-xs" style={{ color: "var(--text-3)", borderTop: "1px solid var(--border)" }}>
              {filtered.length} customer{filtered.length !== 1 ? "s" : ""}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function SendSmsForm() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [immediateEnabled, setImmediateEnabled] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/settings")
      .then(r => r.ok ? r.json() : null)
      .then(d => setImmediateEnabled(d?.sendingMethods?.immediate ?? true));
    fetch("/api/customers?limit=500")
      .then(r => r.json())
      .then(d => setCustomers(d.customers ?? []));
  }, []);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setErrorMsg("");
    const res = await fetch("/api/messages/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customerId, message }),
    });
    if (res.ok) {
      setStatus("sent");
      setMessage("");
      setCustomerId("");
    } else {
      const data = await res.json().catch(() => ({}));
      setErrorMsg(data.error ?? "Failed to send message");
      setStatus("error");
    }
  }

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
            This sending method has been disabled by your administrator. Use Campaigns instead.
          </p>
        </div>
      </div>
    );
  }

  const segments = Math.ceil(message.length / 160) || 1;
  const charsLeft = segments * 160 - message.length;

  return (
    <form onSubmit={send} className="max-w-lg space-y-5">
      {/* Customer picker */}
      <div>
        <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-2)" }}>
          Customer
        </label>
        <CustomerDropdown customers={customers} value={customerId} onChange={setCustomerId} />
      </div>

      {/* Message */}
      <div>
        <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-2)" }}>
          Message
        </label>
        <textarea
          required
          rows={5}
          className="input resize-none w-full"
          value={message}
          onChange={e => { setMessage(e.target.value); setStatus("idle"); }}
          placeholder="Type your message here..."
        />
        <div className="flex items-center justify-between mt-1">
          <p className="text-xs" style={{ color: "var(--text-3)" }}>
            {segments > 1 ? `${segments} segments` : "1 segment"}
          </p>
          <p className="text-xs" style={{ color: message.length > 160 ? "#f59e0b" : "var(--text-3)" }}>
            {message.length} chars · {charsLeft} left in segment
          </p>
        </div>
      </div>

      <button
        type="submit"
        disabled={status === "sending" || !customerId || !message.trim()}
        className="btn-primary w-full py-2.5 flex items-center justify-center gap-2"
        style={{ opacity: (!customerId || !message.trim()) ? 0.5 : 1 }}
      >
        {status === "sending" ? (
          <>
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Sending...
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
            </svg>
            Send SMS
          </>
        )}
      </button>

      {status === "sent" && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm"
          style={{ background: "rgba(34,197,94,0.1)", color: "#16a34a" }}>
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Message sent successfully!
        </div>
      )}
      {status === "error" && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm"
          style={{ background: "rgba(239,68,68,0.1)", color: "#dc2626" }}>
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          {errorMsg}
        </div>
      )}
    </form>
  );
}
