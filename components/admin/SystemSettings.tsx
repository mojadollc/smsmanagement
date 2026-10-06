"use client";

import { useState, useEffect } from "react";

interface Settings {
  twilioAccountSid: string;
  twilioAuthToken: string;
  twilioMessagingServiceSid: string;
  dailyLimit: number;
  appUrl: string;
  timezone: string;
  sendingMethods: { immediate: boolean; batch: boolean };
}

const TIMEZONES = [
  "UTC","America/New_York","America/Chicago","America/Denver",
  "America/Los_Angeles","America/Phoenix","Europe/London",
  "Europe/Paris","Asia/Dubai","Asia/Kolkata","Asia/Tokyo","Australia/Sydney",
];

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-2)" }}>{label}</label>
      {children}
      {hint && <p className="text-xs mt-1.5" style={{ color: "var(--text-3)" }}>{hint}</p>}
    </div>
  );
}

function Section({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="card p-6 space-y-4" style={{ background: "var(--bg-card)" }}>
      <div style={{ borderBottom: "1px solid var(--border)", paddingBottom: "0.75rem" }}>
        <p className="font-semibold" style={{ color: "var(--text)" }}>{title}</p>
        {desc && <p className="text-sm mt-0.5" style={{ color: "var(--text-2)" }}>{desc}</p>}
      </div>
      {children}
    </div>
  );
}

export default function SystemSettings() {
  const [settings, setSettings] = useState<Settings>({
    twilioAccountSid: "", twilioAuthToken: "", twilioMessagingServiceSid: "",
    dailyLimit: 200, appUrl: "", timezone: "UTC",
    sendingMethods: { immediate: true, batch: true },
  });
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  useEffect(() => {
    fetch("/api/settings").then((r) => r.ok ? r.json() : null).then((d) => {
      if (d) setSettings(d);
      setLoading(false);
    });
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving");
    const res = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    setStatus(res.ok ? "saved" : "error");
    setTimeout(() => setStatus("idle"), 3000);
  }

  if (loading) return (
    <div className="flex items-center justify-center py-16">
      <svg className="w-5 h-5 animate-spin" style={{ color: "var(--text-3)" }} fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    </div>
  );

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-2xl">
      <Section title="Twilio Configuration" desc="Credentials for sending and receiving SMS via Twilio.">
        <Field label="Account SID">
          <input className="input text-sm" value={settings.twilioAccountSid}
            onChange={(e) => setSettings((p) => ({ ...p, twilioAccountSid: e.target.value }))}
            placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" />
        </Field>
        <Field label="Auth Token" hint="Leave unchanged to keep the existing token.">
          <input className="input text-sm" type="password" value={settings.twilioAuthToken}
            onChange={(e) => setSettings((p) => ({ ...p, twilioAuthToken: e.target.value }))}
            placeholder="••••••••••••••••••••••••••••••••" />
        </Field>
        <Field label="Messaging Service SID">
          <input className="input text-sm" value={settings.twilioMessagingServiceSid}
            onChange={(e) => setSettings((p) => ({ ...p, twilioMessagingServiceSid: e.target.value }))}
            placeholder="MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" />
        </Field>
      </Section>

      <Section title="Application Settings">
        <Field label="App URL" hint="Used to construct Twilio webhook URLs.">
          <input className="input text-sm" value={settings.appUrl}
            onChange={(e) => setSettings((p) => ({ ...p, appUrl: e.target.value }))}
            placeholder="https://yourdomain.com" />
        </Field>
        <Field label="Timezone">
          <select className="input text-sm" value={settings.timezone}
            onChange={(e) => setSettings((p) => ({ ...p, timezone: e.target.value }))}>
            {TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
          </select>
        </Field>
        <Field label="Daily SMS Limit" hint="Maximum messages sent per day across all campaigns.">
          <input className="input text-sm" type="number" min={1} max={10000} value={settings.dailyLimit}
            onChange={(e) => setSettings((p) => ({ ...p, dailyLimit: Number(e.target.value) }))} />
        </Field>
      </Section>

      <Section title="Sending Methods" desc="Enable or disable how messages can be sent.">
        {(["immediate", "batch"] as const).map((method) => (
          <label key={method} className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" className="w-4 h-4 rounded"
              checked={settings.sendingMethods[method]}
              onChange={(e) => setSettings((p) => ({
                ...p, sendingMethods: { ...p.sendingMethods, [method]: e.target.checked },
              }))} />
            <div>
              <p className="text-sm font-medium capitalize" style={{ color: "var(--text)" }}>{method} Sending</p>
              <p className="text-xs" style={{ color: "var(--text-3)" }}>
                {method === "immediate"
                  ? "Send messages right away via the Send SMS page"
                  : "Schedule messages in batches via campaigns"}
              </p>
            </div>
          </label>
        ))}
      </Section>

      <div className="flex items-center gap-4">
        <button type="submit" disabled={status === "saving"} className="btn-primary px-6 py-2.5">
          {status === "saving" ? "Saving..." : "Save Settings"}
        </button>
        {status === "saved" && (
          <span className="flex items-center gap-1.5 text-sm font-medium" style={{ color: "#16a34a" }}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Saved
          </span>
        )}
        {status === "error" && <span className="text-sm" style={{ color: "#dc2626" }}>Failed to save.</span>}
      </div>
    </form>
  );
}
