"use client";

import { useState, useEffect } from "react";

interface SendingMethods { immediate: boolean; batch: boolean; }

interface SettingsData {
  twilioAccountSid: string;
  twilioAuthToken: string;
  twilioMessagingServiceSid: string;
  dailyLimit: number;
  appUrl: string;
  timezone: string;
  sendingMethods: SendingMethods;
  updatedAt?: string;
}

export default function SettingsPage() {
  const [form, setForm] = useState<SettingsData>({
    twilioAccountSid: "",
    twilioAuthToken: "",
    twilioMessagingServiceSid: "",
    dailyLimit: 200,
    appUrl: "",
    timezone: "UTC",
    sendingMethods: { immediate: true, batch: true },
  });
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [showToken, setShowToken] = useState(false);
  const [activeTab, setActiveTab] = useState<"twilio" | "general" | "sending" | "webhooks">("twilio");

  useEffect(() => {
    fetch("/api/settings").then((r) => r.ok ? r.json() : null).then((d) => {
      if (!d) return;
      setForm({ ...d, sendingMethods: d.sendingMethods ?? { immediate: true, batch: true } });
    });
  }, []);

  function set(field: keyof SettingsData, value: string | number) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving");
    const res = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setStatus(res.ok ? "saved" : "error");
    setTimeout(() => setStatus("idle"), 3000);
  }

  const appUrl = form.appUrl || (typeof window !== "undefined" ? window.location.origin : "");
  const tabs = [
    { id: "twilio" as const,   label: "Twilio" },
    { id: "general" as const,  label: "General" },
    { id: "sending" as const,  label: "Sending Methods" },
    { id: "webhooks" as const, label: "Webhooks" },
  ];

  const noneEnabled = !form.sendingMethods?.immediate && !form.sendingMethods?.batch;

  const sendingMethodDefs = [
    {
      key: "immediate" as const,
      label: "Send Immediately",
      desc: "Sends all messages at once right now. Best for urgent or time-sensitive blasts.",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      iconBg: "rgba(234,179,8,0.12)",
      iconColor: "#ca8a04",
      warning: "May trigger carrier spam filters if sending to large lists.",
    },
    {
      key: "batch" as const,
      label: "Batch / Drip",
      desc: "Spreads messages across time slots throughout the day. Recommended for large campaigns.",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      iconBg: "rgba(59,130,246,0.12)",
      iconColor: "#2563eb",
      warning: null,
    },
  ];

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>Settings</h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--text-2)" }}>Configure your SMS platform</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-lg w-fit" style={{ background: "var(--bg-subtle)" }}>
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className="px-4 py-1.5 rounded-md text-sm font-medium transition-all"
            style={
              activeTab === t.id
                ? { background: "var(--bg-card)", color: "var(--text)", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }
                : { background: "transparent", color: "var(--text-2)" }
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      <form onSubmit={save} className="space-y-4">

        {/* ── Twilio ── */}
        {activeTab === "twilio" && (
          <div className="card p-5 space-y-4" style={{ background: "var(--bg-card)" }}>
            <div>
              <p className="font-semibold" style={{ color: "var(--text)" }}>Twilio Credentials</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>
                Get these from your{" "}
                <a href="https://console.twilio.com" target="_blank" rel="noreferrer" style={{ color: "var(--accent)" }}>Twilio Console</a>
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-2)" }}>Account SID</label>
              <input className="input font-mono" placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" value={form.twilioAccountSid} onChange={(e) => set("twilioAccountSid", e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-2)" }}>Auth Token</label>
              <div className="relative">
                <input type={showToken ? "text" : "password"} className="input font-mono pr-16" placeholder="••••••••••••••••••••••••••••••••" value={form.twilioAuthToken} onChange={(e) => set("twilioAuthToken", e.target.value)} />
                <button type="button" onClick={() => setShowToken(!showToken)} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium" style={{ color: "var(--text-3)" }}>
                  {showToken ? "Hide" : "Show"}
                </button>
              </div>
              <p className="text-xs mt-1" style={{ color: "var(--text-3)" }}>Leave unchanged to keep existing token.</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-2)" }}>Messaging Service SID</label>
              <input className="input font-mono" placeholder="MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" value={form.twilioMessagingServiceSid} onChange={(e) => set("twilioMessagingServiceSid", e.target.value)} />
            </div>
            {form.twilioAccountSid && !form.twilioAuthToken?.startsWith("•") && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm" style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", color: "#16a34a" }}>
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Credentials configured
              </div>
            )}
            {!form.twilioAccountSid && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm" style={{ background: "rgba(234,179,8,0.08)", border: "1px solid rgba(234,179,8,0.2)", color: "#ca8a04" }}>
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                Twilio not configured — SMS sending is disabled
              </div>
            )}
          </div>
        )}

        {/* ── General ── */}
        {activeTab === "general" && (
          <div className="card p-5 space-y-4" style={{ background: "var(--bg-card)" }}>
            <p className="font-semibold" style={{ color: "var(--text)" }}>General Settings</p>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-2)" }}>Daily SMS Limit</label>
              <input type="number" min={1} className="input w-32" value={form.dailyLimit} onChange={(e) => set("dailyLimit", Number(e.target.value))} />
              <p className="text-xs mt-1" style={{ color: "var(--text-3)" }}>Max outbound SMS per day across all campaigns.</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-2)" }}>App URL</label>
              <input className="input" placeholder="https://sms.beegoo.app" value={form.appUrl} onChange={(e) => set("appUrl", e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-2)" }}>Timezone</label>
              <select className="input" value={form.timezone} onChange={(e) => set("timezone", e.target.value)}>
                <option value="UTC">UTC</option>
                <option value="America/New_York">Eastern Time</option>
                <option value="America/Chicago">Central Time</option>
                <option value="America/Denver">Mountain Time</option>
                <option value="America/Los_Angeles">Pacific Time</option>
                <option value="America/Vancouver">Vancouver (PT)</option>
                <option value="Asia/Manila">Manila (PHT)</option>
                <option value="Asia/Singapore">Singapore (SGT)</option>
              </select>
            </div>
          </div>
        )}

        {/* ── Sending Methods ── */}
        {activeTab === "sending" && (
          <div className="card p-5 space-y-5" style={{ background: "var(--bg-card)" }}>
            <div>
              <p className="font-semibold" style={{ color: "var(--text)" }}>Sending Methods</p>
              <p className="text-sm mt-0.5" style={{ color: "var(--text-2)" }}>
                Enable or disable sending methods. Disabled methods are hidden from agents when creating campaigns.
              </p>
            </div>

            {sendingMethodDefs.map((method) => {
              const enabled = form.sendingMethods?.[method.key] ?? true;
              return (
                <div
                  key={method.key}
                  className="flex items-start gap-4 p-4 rounded-xl transition-all"
                  style={{
                    border: `2px solid ${enabled ? "var(--accent)" : "var(--border)"}`,
                    background: enabled ? "var(--accent-soft)" : "var(--bg-subtle)",
                  }}
                >
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ background: method.iconBg, color: method.iconColor }}>
                    {method.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold" style={{ color: "var(--text)" }}>{method.label}</p>
                      <button
                        type="button"
                        onClick={() => setForm((prev) => ({ ...prev, sendingMethods: { ...prev.sendingMethods, [method.key]: !enabled } }))}
                        className="relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0 focus:outline-none"
                        style={{ background: enabled ? "var(--accent)" : "var(--border)" }}
                        aria-label={`Toggle ${method.label}`}
                      >
                        <span
                          className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200"
                          style={{ transform: enabled ? "translateX(20px)" : "translateX(0)" }}
                        />
                      </button>
                    </div>
                    <p className="text-sm mt-0.5" style={{ color: "var(--text-2)" }}>{method.desc}</p>
                    {method.warning && enabled && (
                      <p className="text-xs mt-1.5 flex items-center gap-1" style={{ color: "#ca8a04" }}>
                        <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        {method.warning}
                      </p>
                    )}
                    {!enabled && (
                      <p className="text-xs mt-1.5 font-medium" style={{ color: "var(--text-3)" }}>Disabled — hidden from agents</p>
                    )}
                  </div>
                </div>
              );
            })}

            {noneEnabled && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#dc2626" }}>
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                At least one sending method must be enabled.
              </div>
            )}
          </div>
        )}

        {/* ── Webhooks ── */}
        {activeTab === "webhooks" && (
          <div className="card p-5 space-y-4" style={{ background: "var(--bg-card)" }}>
            <div>
              <p className="font-semibold" style={{ color: "var(--text)" }}>Twilio Webhook URLs</p>
              <p className="text-sm mt-0.5" style={{ color: "var(--text-2)" }}>
                Configure these in your{" "}
                <a href="https://console.twilio.com/us1/develop/sms/services" target="_blank" rel="noreferrer" style={{ color: "var(--accent)" }}>Twilio Messaging Service</a>
              </p>
            </div>
            {[
              { label: "Incoming Message Webhook", path: "/api/webhooks/twilio/incoming" },
              { label: "Status Callback URL", path: "/api/webhooks/twilio/status" },
            ].map((w) => (
              <div key={w.path}>
                <p className="text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--text-3)" }}>{w.label}</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 px-3 py-2.5 rounded-lg text-xs break-all" style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)", color: "var(--text-2)" }}>
                    {appUrl}{w.path}
                  </code>
                  <button type="button" onClick={() => navigator.clipboard.writeText(`${appUrl}${w.path}`)} className="btn-ghost shrink-0 text-xs px-3 py-2.5">Copy</button>
                </div>
              </div>
            ))}
            <div className="px-3 py-2.5 rounded-lg text-sm" style={{ background: "var(--accent-soft)", border: "1px solid rgba(59,130,246,0.2)", color: "var(--accent-text)" }}>
              Also enable <strong>Advanced Opt-Out</strong> in your Messaging Service for automatic STOP/START/HELP handling.
            </div>
          </div>
        )}

        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={status === "saving" || activeTab === "webhooks" || noneEnabled}
            className="btn-primary px-6 py-2.5"
          >
            {status === "saving" ? "Saving..." : "Save Settings"}
          </button>
          {status === "saved" && (
            <span className="text-sm font-medium flex items-center gap-1.5" style={{ color: "#16a34a" }}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              Saved
            </span>
          )}
          {status === "error" && <span className="text-sm" style={{ color: "#dc2626" }}>Failed to save</span>}
          {form.updatedAt && status === "idle" && (
            <span className="text-xs" style={{ color: "var(--text-3)" }}>Last saved: {new Date(form.updatedAt).toLocaleString()}</span>
          )}
        </div>
      </form>
    </div>
  );
}
