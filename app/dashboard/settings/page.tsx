"use client";

import { useState, useEffect } from "react";

interface SettingsData {
  twilioAccountSid: string;
  twilioAuthToken: string;
  twilioMessagingServiceSid: string;
  dailyLimit: number;
  appUrl: string;
  timezone: string;
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
  });
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [showToken, setShowToken] = useState(false);
  const [activeTab, setActiveTab] = useState<"twilio" | "general" | "webhooks">("twilio");

  useEffect(() => {
    fetch("/api/settings").then((r) => r.ok ? r.json() : null).then((d) => d && setForm(d));
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
    { id: "twilio", label: "Twilio" },
    { id: "general", label: "General" },
    { id: "webhooks", label: "Webhooks" },
  ] as const;

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
        {activeTab === "twilio" && (
          <div className="card p-5 space-y-4" style={{ background: "var(--bg-card)" }}>
            <div>
              <p className="font-semibold" style={{ color: "var(--text)" }}>Twilio Credentials</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>
                Get these from your{" "}
                <a href="https://console.twilio.com" target="_blank" rel="noreferrer" style={{ color: "var(--accent)" }}>
                  Twilio Console
                </a>
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-2)" }}>Account SID</label>
              <input
                className="input font-mono"
                placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                value={form.twilioAccountSid}
                onChange={(e) => set("twilioAccountSid", e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-2)" }}>Auth Token</label>
              <div className="relative">
                <input
                  type={showToken ? "text" : "password"}
                  className="input font-mono pr-16"
                  placeholder="••••••••••••••••••••••••••••••••"
                  value={form.twilioAuthToken}
                  onChange={(e) => set("twilioAuthToken", e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium"
                  style={{ color: "var(--text-3)" }}
                >
                  {showToken ? "Hide" : "Show"}
                </button>
              </div>
              <p className="text-xs mt-1" style={{ color: "var(--text-3)" }}>Leave unchanged to keep existing token.</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-2)" }}>Messaging Service SID</label>
              <input
                className="input font-mono"
                placeholder="MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                value={form.twilioMessagingServiceSid}
                onChange={(e) => set("twilioMessagingServiceSid", e.target.value)}
              />
            </div>

            {form.twilioAccountSid && !form.twilioAuthToken?.startsWith("•") && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm" style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", color: "#16a34a" }}>
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Credentials configured
              </div>
            )}
            {!form.twilioAccountSid && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm" style={{ background: "rgba(234,179,8,0.08)", border: "1px solid rgba(234,179,8,0.2)", color: "#ca8a04" }}>
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Twilio not configured — SMS sending is disabled
              </div>
            )}
          </div>
        )}

        {activeTab === "general" && (
          <div className="card p-5 space-y-4" style={{ background: "var(--bg-card)" }}>
            <p className="font-semibold" style={{ color: "var(--text)" }}>General Settings</p>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-2)" }}>Daily SMS Limit</label>
              <input
                type="number"
                min={1}
                className="input w-32"
                value={form.dailyLimit}
                onChange={(e) => set("dailyLimit", Number(e.target.value))}
              />
              <p className="text-xs mt-1" style={{ color: "var(--text-3)" }}>Max outbound SMS per day across all campaigns.</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-2)" }}>App URL</label>
              <input
                className="input"
                placeholder="https://sms.beegoo.app"
                value={form.appUrl}
                onChange={(e) => set("appUrl", e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-2)" }}>Timezone</label>
              <select
                className="input"
                value={form.timezone}
                onChange={(e) => set("timezone", e.target.value)}
              >
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

        {activeTab === "webhooks" && (
          <div className="card p-5 space-y-4" style={{ background: "var(--bg-card)" }}>
            <div>
              <p className="font-semibold" style={{ color: "var(--text)" }}>Twilio Webhook URLs</p>
              <p className="text-sm mt-0.5" style={{ color: "var(--text-2)" }}>
                Configure these in your{" "}
                <a href="https://console.twilio.com/us1/develop/sms/services" target="_blank" rel="noreferrer" style={{ color: "var(--accent)" }}>
                  Twilio Messaging Service
                </a>
              </p>
            </div>

            {[
              { label: "Incoming Message Webhook", path: "/api/webhooks/twilio/incoming" },
              { label: "Status Callback URL", path: "/api/webhooks/twilio/status" },
            ].map((w) => (
              <div key={w.path}>
                <p className="text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--text-3)" }}>{w.label}</p>
                <div className="flex items-center gap-2">
                  <code
                    className="flex-1 px-3 py-2.5 rounded-lg text-xs break-all"
                    style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)", color: "var(--text-2)" }}
                  >
                    {appUrl}{w.path}
                  </code>
                  <button
                    type="button"
                    onClick={() => navigator.clipboard.writeText(`${appUrl}${w.path}`)}
                    className="btn-ghost shrink-0 text-xs px-3 py-2.5"
                  >
                    Copy
                  </button>
                </div>
              </div>
            ))}

            <div
              className="px-3 py-2.5 rounded-lg text-sm"
              style={{ background: "var(--accent-soft)", border: "1px solid rgba(59,130,246,0.2)", color: "var(--accent-text)" }}
            >
              Also enable <strong>Advanced Opt-Out</strong> in your Messaging Service for automatic STOP/START/HELP handling.
            </div>
          </div>
        )}

        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={status === "saving" || activeTab === "webhooks"}
            className="btn-primary px-6 py-2.5"
          >
            {status === "saving" ? "Saving..." : "Save Settings"}
          </button>
          {status === "saved" && (
            <span className="text-sm font-medium flex items-center gap-1.5" style={{ color: "#16a34a" }}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Saved
            </span>
          )}
          {status === "error" && <span className="text-sm" style={{ color: "#dc2626" }}>Failed to save</span>}
          {form.updatedAt && status === "idle" && (
            <span className="text-xs" style={{ color: "var(--text-3)" }}>
              Last saved: {new Date(form.updatedAt).toLocaleString()}
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
