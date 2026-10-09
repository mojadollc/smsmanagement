"use client";

import { useState, useEffect, useRef } from "react";

interface Customer { id: string; firstName: string; lastName: string; phone: string; }

type Tab = "single" | "bulk";

// ─── Customer Dropdown ───────────────────────────────────────────────────────

function CustomerDropdown({ customers, value, onChange }: {
  customers: Customer[]; value: string; onChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const selected = customers.find(c => c.id === value);
  const filtered = query.trim()
    ? customers.filter(c => `${c.firstName} ${c.lastName} ${c.phone}`.toLowerCase().includes(query.toLowerCase()))
    : customers;

  useEffect(() => {
    function h(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => { setOpen(true); setQuery(""); setTimeout(() => inputRef.current?.focus(), 50); }}
        className="input w-full flex items-center justify-between gap-2 text-left" style={{ minHeight: 42 }}>
        {selected ? (
          <span className="flex items-center gap-3 min-w-0">
            <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
              style={{ background: "rgba(59,130,246,0.12)", color: "#3b82f6" }}>
              {selected.firstName[0]?.toUpperCase()}
            </span>
            <span className="min-w-0">
              <span className="font-medium block truncate" style={{ color: "var(--text)" }}>{selected.firstName} {selected.lastName}</span>
              <span className="text-xs block" style={{ color: "var(--text-3)" }}>{selected.phone}</span>
            </span>
          </span>
        ) : <span style={{ color: "var(--text-3)" }}>Select a customer...</span>}
        <svg className="w-4 h-4 shrink-0" style={{ color: "var(--text-3)", transform: open ? "rotate(180deg)" : "none" }}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="absolute z-50 w-full mt-1 rounded-xl overflow-hidden"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border)", boxShadow: "0 8px 24px rgba(0,0,0,0.15)" }}>
          <div className="p-2" style={{ borderBottom: "1px solid var(--border)" }}>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: "var(--bg-subtle)" }}>
              <svg className="w-4 h-4 shrink-0" style={{ color: "var(--text-3)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
              </svg>
              <input ref={inputRef} type="text" value={query} onChange={e => setQuery(e.target.value)}
                placeholder="Search by name or phone..." className="flex-1 bg-transparent outline-none text-sm"
                style={{ color: "var(--text)" }} />
            </div>
          </div>
          <ul className="overflow-y-auto" style={{ maxHeight: 260 }}>
            {filtered.length === 0
              ? <li className="px-4 py-6 text-sm text-center" style={{ color: "var(--text-3)" }}>No customers found</li>
              : filtered.map(c => (
                <li key={c.id}>
                  <button type="button" onClick={() => { onChange(c.id); setQuery(""); setOpen(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left"
                    style={{ background: c.id === value ? "rgba(59,130,246,0.08)" : "transparent" }}
                    onMouseEnter={e => { if (c.id !== value) (e.currentTarget as HTMLElement).style.background = "var(--bg-subtle)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = c.id === value ? "rgba(59,130,246,0.08)" : "transparent"; }}>
                    <span className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                      style={{ background: "rgba(59,130,246,0.12)", color: "#3b82f6" }}>
                      {c.firstName[0]?.toUpperCase()}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block font-medium text-sm" style={{ color: "var(--text)" }}>{c.firstName} {c.lastName}</span>
                      <span className="block text-xs mt-0.5" style={{ color: "var(--text-3)" }}>{c.phone}</span>
                    </span>
                    {c.id === value && (
                      <svg className="w-4 h-4 shrink-0" style={{ color: "#3b82f6" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                </li>
              ))}
          </ul>
          <div className="px-4 py-2 text-xs" style={{ color: "var(--text-3)", borderTop: "1px solid var(--border)" }}>
            {filtered.length} customer{filtered.length !== 1 ? "s" : ""}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Single Send ─────────────────────────────────────────────────────────────

function SingleSendForm({ customers, immediateEnabled }: { customers: Customer[]; immediateEnabled: boolean }) {
  const [customerId, setCustomerId] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  if (!immediateEnabled) {
    return (
      <div className="flex items-start gap-3 px-4 py-4 rounded-xl"
        style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
        <svg className="w-5 h-5 shrink-0 mt-0.5" style={{ color: "#dc2626" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
        </svg>
        <div>
          <p className="font-semibold text-sm" style={{ color: "#dc2626" }}>Send Immediately is disabled</p>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-2)" }}>This sending method has been disabled by your administrator.</p>
        </div>
      </div>
    );
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending"); setErrorMsg("");
    const res = await fetch("/api/messages/send", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customerId, message }),
    });
    if (res.ok) { setStatus("sent"); setMessage(""); setCustomerId(""); }
    else { const d = await res.json().catch(() => ({})); setErrorMsg(d.error ?? "Failed to send"); setStatus("error"); }
  }

  const segments = Math.ceil(message.length / 160) || 1;
  const charsLeft = segments * 160 - message.length;

  return (
    <form onSubmit={send} className="space-y-5">
      <div>
        <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-2)" }}>Customer</label>
        <CustomerDropdown customers={customers} value={customerId} onChange={setCustomerId} />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-2)" }}>Message</label>
        <textarea required rows={5} className="input resize-none w-full" value={message}
          onChange={e => { setMessage(e.target.value); setStatus("idle"); }}
          placeholder="Type your message here..." />
        <div className="flex justify-between mt-1">
          <p className="text-xs" style={{ color: "var(--text-3)" }}>{segments > 1 ? `${segments} segments` : "1 segment"}</p>
          <p className="text-xs" style={{ color: message.length > 160 ? "#f59e0b" : "var(--text-3)" }}>
            {message.length} chars · {charsLeft} left
          </p>
        </div>
      </div>
      <button type="submit" disabled={status === "sending" || !customerId || !message.trim()}
        className="btn-primary w-full py-2.5 flex items-center justify-center gap-2"
        style={{ opacity: (!customerId || !message.trim()) ? 0.5 : 1 }}>
        {status === "sending" ? (
          <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>Sending...</>
        ) : (
          <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
          </svg>Send SMS</>
        )}
      </button>
      {status === "sent" && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm" style={{ background: "rgba(34,197,94,0.1)", color: "#16a34a" }}>
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
          Message sent successfully!
        </div>
      )}
      {status === "error" && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm" style={{ background: "rgba(239,68,68,0.1)", color: "#dc2626" }}>
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
          {errorMsg}
        </div>
      )}
    </form>
  );
}

// ─── Bulk Send ────────────────────────────────────────────────────────────────

const BULK_LIMIT = 180;

type BulkResult = { phone: string; status: "sent" | "failed" | "opted_out" | "invalid"; error?: string };

function normalizePhone(raw: string): string {
  const cleaned = raw.trim().replace(/[^\d+]/g, "");
  if (!cleaned) return "";
  if (!cleaned.startsWith("+")) {
    if (cleaned.length === 10) return `+1${cleaned}`;
    if (cleaned.length === 11 && cleaned.startsWith("1")) return `+${cleaned}`;
    return `+${cleaned}`;
  }
  return cleaned;
}

function BulkSendForm() {
  const [inputVal, setInputVal] = useState("");
  const [phones, setPhones] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [sentToday, setSentToday] = useState(0);
  const [sending, setSending] = useState(false);
  const [results, setResults] = useState<BulkResult[] | null>(null);
  const [parseError, setParseError] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const remaining = Math.max(0, BULK_LIMIT - sentToday);
  const canAddMore = phones.length < remaining;

  useEffect(() => {
    fetch("/api/messages/bulk-status")
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setSentToday(d.sentToday); });
  }, []);

  function parseAndAdd(raw: string) {
    setParseError("");
    const parts = raw.split(/[\s,;\n]+/).map(s => s.trim()).filter(Boolean);
    const valid: string[] = [];
    const invalid: string[] = [];
    for (const p of parts) {
      const n = normalizePhone(p);
      if (n.length >= 8) valid.push(n);
      else if (p) invalid.push(p);
    }
    if (invalid.length) setParseError(`Skipped invalid: ${invalid.join(", ")}`);
    const deduped = [...new Set([...phones, ...valid])];
    const capped = deduped.slice(0, remaining);
    if (deduped.length > remaining) setParseError(`Limit reached — only ${remaining} slots remaining today.`);
    setPhones(capped);
    setInputVal("");
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (["Enter", ",", " "].includes(e.key)) {
      e.preventDefault();
      if (inputVal.trim()) parseAndAdd(inputVal);
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text");
    parseAndAdd(inputVal + " " + pasted);
  }

  function removePhone(p: string) {
    setPhones(prev => prev.filter(x => x !== p));
    setParseError("");
  }

  async function sendBulk(e: React.FormEvent) {
    e.preventDefault();
    if (!phones.length || !message.trim()) return;
    setSending(true);
    setResults(null);
    const res = await fetch("/api/messages/send-bulk", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phones, message }),
    });
    const data = await res.json();
    setResults(data.results ?? []);
    setSentToday(prev => prev + (data.sentCount ?? 0));
    if (data.limitReached || data.remaining === 0) {
      setPhones([]);
      setMessage("");
    }
    setSending(false);
  }

  const sentCount  = results?.filter(r => r.status === "sent").length ?? 0;
  const failCount  = results?.filter(r => r.status === "failed").length ?? 0;
  const optOutCount = results?.filter(r => r.status === "opted_out").length ?? 0;
  const limitPct   = Math.min(100, (sentToday / BULK_LIMIT) * 100);
  const limitColor = limitPct >= 100 ? "#ef4444" : limitPct >= 80 ? "#f59e0b" : "#3b82f6";
  const segments   = Math.ceil(message.length / 160) || 1;

  return (
    <form onSubmit={sendBulk} className="space-y-5">

      {/* Daily limit bar */}
      <div className="rounded-xl p-4" style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)" }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium" style={{ color: "var(--text)" }}>Daily Bulk Limit</span>
          <span className="text-sm font-bold" style={{ color: limitColor }}>{sentToday} / {BULK_LIMIT} sent today</span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${limitPct}%`, background: limitColor }} />
        </div>
        <p className="text-xs mt-1.5" style={{ color: "var(--text-3)" }}>
          {remaining > 0 ? `${remaining} remaining today · resets at midnight` : "Daily limit reached — resets at midnight"}
        </p>
      </div>

      {/* Phone number chips input */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-sm font-medium" style={{ color: "var(--text-2)" }}>Recipients</label>
          <span className="text-xs font-medium px-2 py-0.5 rounded-full"
            style={{ background: phones.length >= remaining ? "rgba(239,68,68,0.1)" : "rgba(59,130,246,0.1)", color: phones.length >= remaining ? "#ef4444" : "#3b82f6" }}>
            {phones.length} / {remaining} added
          </span>
        </div>

        <div className="rounded-xl p-3 min-h-[80px]" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
          onClick={() => document.getElementById("bulk-phone-input")?.focus()}>
          <div className="flex flex-wrap gap-2 mb-2">
            {phones.map(p => (
              <span key={p} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                style={{ background: "rgba(59,130,246,0.12)", color: "#3b82f6" }}>
                {p}
                <button type="button" onClick={() => removePhone(p)} className="hover:opacity-70">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            ))}
          </div>
          {canAddMore ? (
            <input id="bulk-phone-input" type="text" value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              onBlur={() => { if (inputVal.trim()) parseAndAdd(inputVal); }}
              placeholder={phones.length === 0 ? "Type or paste numbers: +16021234567, +16029876543..." : "Add more numbers..."}
              className="w-full bg-transparent outline-none text-sm"
              style={{ color: "var(--text)" }} />
          ) : (
            <p className="text-xs" style={{ color: "#ef4444" }}>Limit reached for today</p>
          )}
        </div>

        <p className="text-xs mt-1.5" style={{ color: "var(--text-3)" }}>
          Separate numbers with comma, space, or Enter. Paste multiple at once. Auto-creates customer if not found.
        </p>
        {parseError && <p className="text-xs mt-1 font-medium" style={{ color: "#f59e0b" }}>{parseError}</p>}
      </div>

      {/* Message */}
      <div>
        <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-2)" }}>Message</label>
        <textarea ref={textareaRef} required rows={5} className="input resize-none w-full" value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="Type your message here..." />
        <div className="flex justify-between mt-1">
          <p className="text-xs" style={{ color: "var(--text-3)" }}>{segments > 1 ? `${segments} segments` : "1 segment"}</p>
          <p className="text-xs" style={{ color: message.length > 160 ? "#f59e0b" : "var(--text-3)" }}>
            {message.length} chars · {segments * 160 - message.length} left in segment
          </p>
        </div>
      </div>

      {/* Send button */}
      <button type="submit"
        disabled={sending || phones.length === 0 || !message.trim() || remaining === 0}
        className="btn-primary w-full py-2.5 flex items-center justify-center gap-2"
        style={{ opacity: (phones.length === 0 || !message.trim() || remaining === 0) ? 0.5 : 1 }}>
        {sending ? (
          <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>Sending to {phones.length} recipients...</>
        ) : (
          <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
          </svg>Send to {phones.length} Recipient{phones.length !== 1 ? "s" : ""}</>
        )}
      </button>

      {/* Results */}
      {results && (
        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
          <div className="px-4 py-3 flex items-center gap-6" style={{ background: "var(--bg-subtle)" }}>
            <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>Results</span>
            <span className="flex items-center gap-1.5 text-sm" style={{ color: "#16a34a" }}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              {sentCount} sent
            </span>
            {failCount > 0 && (
              <span className="flex items-center gap-1.5 text-sm" style={{ color: "#dc2626" }}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                {failCount} failed
              </span>
            )}
            {optOutCount > 0 && (
              <span className="flex items-center gap-1.5 text-sm" style={{ color: "#f59e0b" }}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                {optOutCount} opted out
              </span>
            )}
          </div>
          <ul className="divide-y" style={{ borderColor: "var(--border)", maxHeight: 240, overflowY: "auto" }}>
            {results.map((r, i) => {
              const icon = r.status === "sent"
                ? <svg className="w-4 h-4 shrink-0" style={{ color: "#16a34a" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                : r.status === "opted_out"
                ? <svg className="w-4 h-4 shrink-0" style={{ color: "#f59e0b" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                : <svg className="w-4 h-4 shrink-0" style={{ color: "#dc2626" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;
              return (
                <li key={i} className="flex items-center gap-3 px-4 py-2.5" style={{ background: "var(--bg-card)" }}>
                  {icon}
                  <span className="text-sm font-medium flex-1" style={{ color: "var(--text)" }}>{r.phone}</span>
                  <span className="text-xs" style={{ color: "var(--text-3)" }}>{r.error ?? r.status}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </form>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export default function SendSmsForm() {
  const [tab, setTab] = useState<Tab>("single");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [immediateEnabled, setImmediateEnabled] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/settings")
      .then(r => r.ok ? r.json() : null)
      .then(d => setImmediateEnabled(d?.sendingMethods?.immediate ?? true));
    fetch("/api/customers?limit=500")
      .then(r => r.json())
      .then(d => setCustomers(d.customers ?? []));
  }, []);

  if (immediateEnabled === null) {
    return <div className="text-sm" style={{ color: "var(--text-3)" }}>Loading...</div>;
  }

  return (
    <div className="max-w-xl space-y-5">
      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)", width: "fit-content" }}>
        {([
          { key: "single", label: "Single Customer", icon: <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /> },
          { key: "bulk",   label: "Bulk Send",       icon: <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" /> },
        ] as { key: Tab; label: string; icon: React.ReactNode }[]).map(t => (
          <button key={t.key} type="button" onClick={() => setTab(t.key)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              background: tab === t.key ? "var(--bg-card)" : "transparent",
              color: tab === t.key ? "var(--accent)" : "var(--text-3)",
              boxShadow: tab === t.key ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
            }}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>{t.icon}</svg>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "single"
        ? <SingleSendForm customers={customers} immediateEnabled={immediateEnabled} />
        : <BulkSendForm />
      }
    </div>
  );
}
