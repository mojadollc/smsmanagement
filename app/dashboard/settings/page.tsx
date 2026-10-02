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

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
}

const DEFAULTS: SettingsData = {
  twilioAccountSid: "",
  twilioAuthToken: "",
  twilioMessagingServiceSid: "",
  dailyLimit: 200,
  appUrl: "",
  timezone: "UTC",
  sendingMethods: { immediate: true, batch: true },
};

function SectionCard({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="card p-6 space-y-5" style={{ background: "var(--bg-card)" }}>
      <div style={{ borderBottom: "1px solid var(--border)", paddingBottom: "1rem", marginBottom: "0.25rem" }}>
        <p className="font-semibold text-base" style={{ color: "var(--text)" }}>{title}</p>
        {desc && <p className="text-sm mt-0.5" style={{ color: "var(--text-2)" }}>{desc}</p>}
      </div>
      {children}
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-2)" }}>{label}</label>
      {children}
      {hint && <p className="text-xs mt-1.5" style={{ color: "var(--text-3)" }}>{hint}</p>}
    </div>
  );
}

function SaveBar({ status, disabled }: { status: string; disabled: boolean }) {
  return (
    <div className="flex items-center gap-4 pt-2">
      <button type="submit" disabled={disabled} className="btn-primary px-6 py-2.5">
        {status === "saving" ? "Saving..." : "Save Changes"}
      </button>
      {status === "saved" && (
        <span className="flex items-center gap-1.5 text-sm font-medium" style={{ color: "#16a34a" }}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Saved successfully
        </span>
      )}
      {status === "error" && (
        <span className="text-sm" style={{ color: "#dc2626" }}>Failed to save. Try again.</span>
      )}
    </div>
  );
}

export default function SettingsPage() {
  const [form, setForm] = useState<SettingsData>(DEFAULTS);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [showToken, setShowToken] = useState(false);
  const [activeTab, setActiveTab] = useState<"profile" | "twilio" | "general" | "sending" | "webhooks">("profile");
  const [copied, setCopied] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileForm, setProfileForm] = useState({ name: "", email: "", currentPassword: "", newPassword: "" });
  const [profileStatus, setProfileStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  useEffect(() => {
    fetch("/api/settings").then((r) => r.ok ? r.json() : null).then((d) => {
      if (!d) return;
      setForm({ ...DEFAULTS, ...d, sendingMethods: d.sendingMethods ?? DEFAULTS.sendingMethods });
    });
    fetch("/api/auth/me").then((r) => r.ok ? r.json() : null).then((d) => {
      if (d) {
        setProfile(d);
        setProfileForm({ name: d.name || "", email: d.email || "", currentPassword: "", newPassword: "" });
      }
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

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileStatus("saving");
    const res = await fetch("/api/user/update", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profileForm),
    });
    const data = await res.json();
    if (res.ok) {
      setProfileStatus("saved");
      if (data.user) {
        setProfile(data.user);
        setProfileForm(prev => ({ ...prev, currentPassword: "", newPassword: "" }));
      }
    } else {
      setProfileStatus("error");
    }
    setTimeout(() => setProfileStatus("idle"), 3000);
  }

  function copyUrl(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  const appUrl = form.appUrl || (typeof window !== "undefined" ? window.location.origin : "");
  const noneEnabled = !form.sendingMethods?.immediate && !form.sendingMethods?.batch;

  const tabs = [
    {
      id: "profile" as const, label: "Profile",
      icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
    },
    {
      id: "twilio" as const, label: "Twilio",
      icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>,
    },
    {
      id: "general" as const, label: "General",
      icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
    },
    {
      id: "sending" as const, label: "Sending Methods",
      icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>,
    },
    {
      id: "webhooks" as const, label: "Webhooks",
      icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>Settings</h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--text-2)" }}>Configure your SMS platform</p>
      </div>

      <div className="flex gap-6 items-start">
        {/* Sidebar tabs */}
        <nav className="w-48 shrink-0 space-y-0.5">
          {tabs.map((t) => {
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-left transition-all"
                style={{
                  background: active ? "var(--accent-soft)" : "transparent",
                  color: active ? "var(--accent-text)" : "var(--text-2)",
                  border: active ? "1px solid rgba(59,130,246,0.2)" : "1px solid transparent",
                }}
              >
                <span style={{ color: active ? "var(--accent)" : "var(--text-3)" }}>{t.icon}</span>
                {t.label}
              </button>
            );
          })}
        </nav>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* ── Profile ── */}
          {activeTab === "profile" && profile && (
            <form onSubmit={saveProfile} className="space-y-4">
              <SectionCard title="Profile Settings" desc="Update your account information and password.">
                <Field label="Name">
                  <input className="input" value={profileForm.name} onChange={(e) => setProfileForm(prev => ({ ...prev, name: e.target.value }))} />
                </Field>
                <Field label="Email">
                  <input type="email" className="input" value={profileForm.email} onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))} />
                </Field>
                <Field label="Role">
                  <input className="input" value={profile.role === "admin" ? "Administrator" : "Agent"} disabled style={{ opacity: 0.6, cursor: "not-allowed" }} />
                </Field>

                <div style={{ borderTop: "1px solid var(--border)", paddingTop: "1rem", marginTop: "1rem" }}>
                  <p className="font-medium mb-4" style={{ color: "var(--text)" }}>Change Password</p>
                  <Field label="Current Password" hint="Required to change your password.">
                    <input type="password" className="input" value={profileForm.currentPassword} onChange={(e) => setProfileForm(prev => ({ ...prev, currentPassword: e.target.value }))} placeholder="Enter current password" />
                  </Field>
                  <Field label="New Password" hint="Must be at least 8 characters.">
                    <input type="password" className="input" value={profileForm.newPassword} onChange={(e) => setProfileForm(prev => ({ ...prev, newPassword: e.target.value }))} placeholder="Enter new password" />
                  </Field>
                </div>

                <SaveBar status={profileStatus} disabled={profileStatus === "saving"} />
              </SectionCard>
            </form>
          )}

          <form onSubmit={save} className="space-y-4">

            {/* ── Twilio ── */}
            {activeTab === "twilio" && (
              <SectionCard title="Twilio Credentials" desc="Connect your Twilio account to enable SMS sending.">
                <Field label="Account SID">
                  <input className="input font-mono" placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" value={form.twilioAccountSid} onChange={(e) => set("twilioAccountSid", e.target.value)} />
                </Field>
                <Field label="Auth Token" hint="Leave blank to keep the existing token.">
                  <div className="relative">
                    <input
                      type={showToken ? "text" : "password"}
                      className="input font-mono pr-16"
                      placeholder="••••••••••••••••••••••••••••••••"
                      value={form.twilioAuthToken}
                      onChange={(e) => set("twilioAuthToken", e.target.value)}
                    />
                    <button type="button" onClick={() => setShowToken(!showToken)} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium px-1" style={{ color: "var(--text-3)" }}>
                      {showToken ? "Hide" : "Show"}
                    </button>
                  </div>
                </Field>
                <Field label="Messaging Service SID">
                  <input className="input font-mono" placeholder="MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" value={form.twilioMessagingServiceSid} onChange={(e) => set("twilioMessagingServiceSid", e.target.value)} />
                </Field>

                {/* Status banner */}
                {form.twilioAccountSid ? (
                  <div className="flex items-center gap-2.5 px-4 py-3 rounded-lg text-sm" style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", color: "#16a34a" }}>
                    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span>Twilio credentials are configured</span>
                    <a href="https://console.twilio.com" target="_blank" rel="noreferrer" className="ml-auto text-xs underline" style={{ color: "#16a34a" }}>Open Console →</a>
                  </div>
                ) : (
                  <div className="flex items-center gap-2.5 px-4 py-3 rounded-lg text-sm" style={{ background: "rgba(234,179,8,0.08)", border: "1px solid rgba(234,179,8,0.2)", color: "#ca8a04" }}>
                    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    Twilio not configured — SMS sending is disabled
                  </div>
                )}

                <SaveBar status={status} disabled={status === "saving"} />
              </SectionCard>
            )}

            {/* ── General ── */}
            {activeTab === "general" && (
              <SectionCard title="General Settings" desc="Configure platform-wide behaviour and limits.">
                <Field label="Daily SMS Limit" hint="Maximum outbound messages per day across all campaigns.">
                  <div className="flex items-center gap-3">
                    <input type="number" min={1} className="input w-36" value={form.dailyLimit} onChange={(e) => set("dailyLimit", Number(e.target.value))} />
                    <span className="text-sm" style={{ color: "var(--text-3)" }}>messages / day</span>
                  </div>
                </Field>
                <Field label="App URL" hint="Used to generate webhook URLs. Include https://.">
                  <input className="input" placeholder="https://sms.beegoo.app" value={form.appUrl} onChange={(e) => set("appUrl", e.target.value)} />
                </Field>
                <Field label="Timezone" hint="Used for scheduling batch campaigns.">
                  <select className="input" value={form.timezone} onChange={(e) => set("timezone", e.target.value)}>
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">Eastern Time (ET)</option>
                    <option value="America/Chicago">Central Time (CT)</option>
                    <option value="America/Denver">Mountain Time (MT)</option>
                    <option value="America/Los_Angeles">Pacific Time (PT)</option>
                    <option value="America/Vancouver">Vancouver (PT)</option>
                    <option value="Asia/Manila">Manila (PHT)</option>
                    <option value="Asia/Singapore">Singapore (SGT)</option>
                  </select>
                </Field>
                <SaveBar status={status} disabled={status === "saving"} />
              </SectionCard>
            )}

            {/* ── Sending Methods ── */}
            {activeTab === "sending" && (
              <SectionCard title="Sending Methods" desc="Control which sending methods agents can use when creating campaigns.">
                {[
                  {
                    key: "immediate" as const,
                    label: "Send Immediately",
                    desc: "Sends all messages at once right now. Best for urgent or time-sensitive blasts.",
                    iconBg: "rgba(234,179,8,0.12)", iconColor: "#ca8a04",
                    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
                    warning: "May trigger carrier spam filters on large lists.",
                  },
                  {
                    key: "batch" as const,
                    label: "Batch / Drip",
                    desc: "Spreads messages across scheduled time slots throughout the day.",
                    iconBg: "rgba(59,130,246,0.12)", iconColor: "#2563eb",
                    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
                    warning: null,
                  },
                ].map((m) => {
                  const enabled = form.sendingMethods?.[m.key] ?? true;
                  return (
                    <div
                      key={m.key}
                      className="flex items-start gap-4 p-4 rounded-xl transition-all"
                      style={{
                        border: `2px solid ${enabled ? "var(--accent)" : "var(--border)"}`,
                        background: enabled ? "var(--accent-soft)" : "var(--bg-subtle)",
                      }}
                    >
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: m.iconBg, color: m.iconColor }}>
                        {m.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-semibold" style={{ color: "var(--text)" }}>{m.label}</p>
                          <button
                            type="button"
                            onClick={() => setForm((prev) => ({ ...prev, sendingMethods: { ...prev.sendingMethods, [m.key]: !enabled } }))}
                            className="relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0 focus:outline-none"
                            style={{ background: enabled ? "var(--accent)" : "var(--border)" }}
                          >
                            <span className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200" style={{ transform: enabled ? "translateX(20px)" : "translateX(0)" }} />
                          </button>
                        </div>
                        <p className="text-sm mt-0.5" style={{ color: "var(--text-2)" }}>{m.desc}</p>
                        {m.warning && enabled && (
                          <p className="text-xs mt-1.5 flex items-center gap-1" style={{ color: "#ca8a04" }}>
                            <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                            {m.warning}
                          </p>
                        )}
                        {!enabled && <p className="text-xs mt-1.5 font-medium" style={{ color: "var(--text-3)" }}>Disabled — hidden from agents</p>}
                      </div>
                    </div>
                  );
                })}

                {noneEnabled && (
                  <div className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#dc2626" }}>
                    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    At least one sending method must be enabled.
                  </div>
                )}

                <SaveBar status={status} disabled={status === "saving" || noneEnabled} />
              </SectionCard>
            )}

            {/* ── Webhooks ── */}
            {activeTab === "webhooks" && (
              <SectionCard title="Webhook URLs" desc="Configure these endpoints in your Twilio Messaging Service.">
                {[
                  { key: "incoming", label: "Incoming Message Webhook", path: "/api/webhooks/twilio/incoming", desc: "Receives inbound SMS from customers." },
                  { key: "status", label: "Status Callback URL", path: "/api/webhooks/twilio/status", desc: "Receives delivery status updates." },
                ].map((w) => (
                  <div key={w.key}>
                    <div className="flex items-start justify-between mb-1.5">
                      <div>
                        <p className="text-sm font-medium" style={{ color: "var(--text)" }}>{w.label}</p>
                        <p className="text-xs" style={{ color: "var(--text-3)" }}>{w.desc}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 px-3 py-2.5 rounded-lg text-xs break-all" style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)", color: "var(--text-2)" }}>
                        {appUrl}{w.path}
                      </code>
                      <button
                        type="button"
                        onClick={() => copyUrl(`${appUrl}${w.path}`, w.key)}
                        className="shrink-0 flex items-center gap-1.5 text-xs font-medium px-3 py-2.5 rounded-lg transition-colors"
                        style={{
                          background: copied === w.key ? "rgba(34,197,94,0.1)" : "var(--bg-subtle)",
                          border: "1px solid var(--border)",
                          color: copied === w.key ? "#16a34a" : "var(--text-2)",
                        }}
                      >
                        {copied === w.key ? (
                          <><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>Copied</>
                        ) : (
                          <><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>Copy</>
                        )}
                      </button>
                    </div>
                  </div>
                ))}

                <div className="flex items-start gap-3 px-4 py-3 rounded-lg" style={{ background: "var(--accent-soft)", border: "1px solid rgba(59,130,246,0.2)" }}>
                  <svg className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "var(--accent)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <p className="text-sm" style={{ color: "var(--accent-text)" }}>
                    Also enable <strong>Advanced Opt-Out</strong> in your{" "}
                    <a href="https://console.twilio.com/us1/develop/sms/services" target="_blank" rel="noreferrer" className="underline">Twilio Messaging Service</a>
                    {" "}for automatic STOP/START/HELP handling.
                  </p>
                </div>
              </SectionCard>
            )}

          </form>
        </div>
      </div>
    </div>
  );
}
