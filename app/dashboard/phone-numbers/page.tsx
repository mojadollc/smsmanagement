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

export default function PhoneNumbersPage() {
  const [numbers, setNumbers] = useState<PhoneNumber[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState("");

  async function loadNumbers() {
    try {
      const res = await fetch("/api/phone-numbers");
      if (res.ok) {
        const data = await res.json();
        setNumbers(data);
      } else {
        setError("Failed to load phone numbers");
      }
    } catch {
      setError("Failed to load phone numbers");
    } finally {
      setLoading(false);
    }
  }

  async function syncNumbers() {
    setSyncing(true);
    setError("");
    try {
      const res = await fetch("/api/phone-numbers");
      if (res.ok) {
        const data = await res.json();
        setNumbers(data);
      }
    } catch {
      setError("Sync failed");
    } finally {
      setSyncing(false);
    }
  }

  useEffect(() => {
    loadNumbers();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>Phone Numbers</h1>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-32 rounded-xl" style={{ background: "var(--bg-subtle)" }} />
          <div className="h-32 rounded-xl" style={{ background: "var(--bg-subtle)" }} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>Phone Numbers</h1>
        <button
          onClick={syncNumbers}
          disabled={syncing}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
          style={{ 
            background: "linear-gradient(135deg, #3b82f6, #6366f1)", 
            color: "white",
            opacity: syncing ? 0.7 : 1
          }}
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
        <div className="px-4 py-3 rounded-lg text-sm" style={{ background: "rgba(239, 68, 68, 0.1)", color: "#dc2626" }}>
          {error}
        </div>
      )}

      {numbers.length === 0 ? (
        <div 
          className="rounded-xl p-8 text-center"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
        >
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "var(--bg-subtle)" }}>
            <svg className="w-8 h-8" style={{ color: "var(--text-3)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </div>
          <p className="text-lg font-medium mb-2" style={{ color: "var(--text)" }}>No phone numbers found</p>
          <p className="text-sm" style={{ color: "var(--text-3)" }}>
            Make sure you have phone numbers in your Twilio account, then click "Sync from Twilio"
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {numbers.map((n) => (
            <div 
              key={n.id} 
              className="rounded-xl p-5 transition-all"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-lg font-semibold" style={{ color: "var(--text)" }}>{n.phoneNumber}</p>
                  <p className="text-sm mt-1" style={{ color: "var(--text-3)" }}>SID: {n.twilioSid}</p>
                  {n.messagingServiceSid && (
                    <p className="text-sm" style={{ color: "var(--text-3)" }}>
                      Messaging Service: {n.messagingServiceSid}
                    </p>
                  )}
                </div>
                <span 
                  className="text-xs px-3 py-1.5 rounded-full font-medium"
                  style={{ 
                    background: n.status === "active" ? "rgba(34, 197, 94, 0.15)" : "var(--bg-subtle)", 
                    color: n.status === "active" ? "#16a34a" : "var(--text-3)" 
                  }}
                >
                  {n.status}
                </span>
              </div>
              <div className="mt-4 flex gap-6">
                <div className="flex items-center gap-2">
                  <span 
                    className="w-2 h-2 rounded-full"
                    style={{ background: n.smsEnabled ? "#22c55e" : "var(--text-3)" }}
                  />
                  <span className="text-sm" style={{ color: n.smsEnabled ? "var(--text)" : "var(--text-3)" }}>
                    SMS {n.smsEnabled ? "Enabled" : "Disabled"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span 
                    className="w-2 h-2 rounded-full"
                    style={{ background: n.mmsEnabled ? "#22c55e" : "var(--text-3)" }}
                  />
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
