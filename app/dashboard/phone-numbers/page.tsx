"use client";

import { useState, useEffect } from "react";

interface PhoneNumber {
  id: string;
  phoneNumber: string;
  twilioSid: string;
  messagingServiceSid: string | null;
  smsEnabled: boolean;
  mmsEnabled: boolean;
  status: string;
  createdAt: string;
}

interface Balance {
  balance: string;
  currency: string;
}

export default function PhoneNumbersPage() {
  const [numbers, setNumbers] = useState<PhoneNumber[]>([]);
  const [balance, setBalance] = useState<Balance | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState("");

  async function loadData() {
    try {
      const [numRes, balRes] = await Promise.all([
        fetch("/api/phone-numbers"),
        fetch("/api/twilio/balance"),
      ]);
      if (numRes.ok) setNumbers(await numRes.json());
      else setError("Failed to load phone numbers");
      if (balRes.ok) setBalance(await balRes.json());
    } catch {
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  async function syncNumbers() {
    setSyncing(true);
    setError("");
    try {
      const [numRes, balRes] = await Promise.all([
        fetch("/api/phone-numbers"),
        fetch("/api/twilio/balance"),
      ]);
      if (numRes.ok) setNumbers(await numRes.json());
      if (balRes.ok) setBalance(await balRes.json());
    } catch {
      setError("Sync failed");
    } finally {
      setSyncing(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>Phone Numbers</h1>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-24 rounded-xl" style={{ background: "var(--bg-subtle)" }} />
          <div className="h-32 rounded-xl" style={{ background: "var(--bg-subtle)" }} />
        </div>
      </div>
    );
  }

  const balanceNum = balance ? parseFloat(balance.balance) : null;
  const balanceColor = balanceNum == null ? "var(--text)" : balanceNum < 5 ? "#ef4444" : balanceNum < 20 ? "#f59e0b" : "#22c55e";

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>Phone Numbers</h1>
        <button
          onClick={syncNumbers}
          disabled={syncing}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
          style={{ background: "linear-gradient(135deg, #3b82f6, #6366f1)", color: "white", opacity: syncing ? 0.7 : 1 }}
        >
          {syncing ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Syncing...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Sync from Twilio
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-lg text-sm" style={{ background: "rgba(239,68,68,0.1)", color: "#dc2626" }}>
          {error}
        </div>
      )}

      {/* Balance Card */}
      <div className="rounded-xl p-5 flex items-center gap-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
        <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(16,185,129,0.1)" }}>
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="#10b981" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
          </svg>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide mb-0.5" style={{ color: "var(--text-3)" }}>Twilio Account Balance</p>
          {balance ? (
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold" style={{ color: balanceColor }}>
                ${parseFloat(balance.balance).toFixed(2)}
              </p>
              <span className="text-sm font-medium" style={{ color: "var(--text-3)" }}>{balance.currency}</span>
              {balanceNum != null && balanceNum < 5 && (
                <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }}>
                  Low balance
                </span>
              )}
              {balanceNum != null && balanceNum >= 5 && balanceNum < 20 && (
                <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "rgba(245,158,11,0.1)", color: "#f59e0b" }}>
                  Running low
                </span>
              )}
            </div>
          ) : (
            <p className="text-sm" style={{ color: "var(--text-3)" }}>Unable to fetch balance</p>
          )}
        </div>
      </div>

      {/* Phone Numbers */}
      {numbers.length === 0 ? (
        <div className="rounded-xl p-8 text-center" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "var(--bg-subtle)" }}>
            <svg className="w-8 h-8" style={{ color: "var(--text-3)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </div>
          <p className="text-lg font-medium mb-2" style={{ color: "var(--text)" }}>No phone numbers found</p>
          <p className="text-sm" style={{ color: "var(--text-3)" }}>
            Make sure you have phone numbers in your Twilio account, then click &quot;Sync from Twilio&quot;
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {numbers.map(n => (
            <div key={n.id} className="rounded-xl p-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-lg font-semibold" style={{ color: "var(--text)" }}>{n.phoneNumber}</p>
                  <p className="text-xs mt-1 font-mono" style={{ color: "var(--text-3)" }}>SID: {n.twilioSid}</p>
                  {n.messagingServiceSid && (
                    <p className="text-xs font-mono" style={{ color: "var(--text-3)" }}>Messaging Service: {n.messagingServiceSid}</p>
                  )}
                </div>
                <span className="text-xs px-3 py-1.5 rounded-full font-medium"
                  style={{ background: n.status === "active" ? "rgba(34,197,94,0.15)" : "var(--bg-subtle)", color: n.status === "active" ? "#16a34a" : "var(--text-3)" }}>
                  {n.status}
                </span>
              </div>
              <div className="mt-4 flex gap-6">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ background: n.smsEnabled ? "#22c55e" : "var(--text-3)" }} />
                  <span className="text-sm" style={{ color: n.smsEnabled ? "var(--text)" : "var(--text-3)" }}>
                    SMS {n.smsEnabled ? "Enabled" : "Disabled"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ background: n.mmsEnabled ? "#22c55e" : "var(--text-3)" }} />
                  <span className="text-sm" style={{ color: n.mmsEnabled ? "var(--text)" : "var(--text-3)" }}>
                    MMS {n.mmsEnabled ? "Enabled" : "Disabled"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
