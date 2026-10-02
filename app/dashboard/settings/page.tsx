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
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-0.5">Configure your SMS platform</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${activeTab === t.id ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <form onSubmit={save} className="space-y-4">
        {activeTab === "twilio" && (
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <div>
              <p className="font-semibold text-gray-900 mb-1">Twilio Credentials</p>
              <p className="text-xs text-gray-400">Get these from your <a href="https://console.twilio.com" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">Twilio Console</a></p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Account SID</label>
              <input
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                value={form.twilioAccountSid}
                onChange={(e) => set("twilioAccountSid", e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Auth Token</label>
              <div className="relative">
                <input
                  type={showToken ? "text" : "password"}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 pr-16"
                  placeholder="••••••••••••••••••••••••••••••••"
                  value={form.twilioAuthToken}
                  onChange={(e) => set("twilioAuthToken", e.target.value)}
                />
                <button type="button" onClick={() => setShowToken(!showToken)} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600">
                  {showToken ? "Hide" : "Show"}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1">Leave unchanged to keep existing token.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Messaging Service SID</label>
              <input
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                value={form.twilioMessagingServiceSid}
                onChange={(e) => set("twilioMessagingServiceSid", e.target.value)}
              />
            </div>

            {form.twilioAccountSid && !form.twilioAuthToken?.startsWith("•") && (
              <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                <span className="text-green-600 text-sm">✓</span>
                <span className="text-sm text-green-700">Credentials configured</span>
              </div>
            )}
            {!form.twilioAccountSid && (
              <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
                <span className="text-yellow-600 text-sm">⚠</span>
                <span className="text-sm text-yellow-700">Twilio not configured — SMS sending is disabled</span>
              </div>
            )}
          </div>
        )}

        {activeTab === "general" && (
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <p className="font-semibold text-gray-900">General Settings</p>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Daily SMS Limit</label>
              <input
                type="number"
                min={1}
                className="w-32 border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.dailyLimit}
                onChange={(e) => set("dailyLimit", Number(e.target.value))}
              />
              <p className="text-xs text-gray-400 mt-1">Max outbound SMS per day across all campaigns.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">App URL</label>
              <input
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://sms.beegoo.app"
                value={form.appUrl}
                onChange={(e) => set("appUrl", e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Timezone</label>
              <select
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <div>
              <p className="font-semibold text-gray-900 mb-1">Twilio Webhook URLs</p>
              <p className="text-sm text-gray-500">Configure these in your <a href="https://console.twilio.com/us1/develop/sms/services" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">Twilio Messaging Service</a></p>
            </div>

            {[
              { label: "Incoming Message Webhook", path: "/api/webhooks/twilio/incoming" },
              { label: "Status Callback URL", path: "/api/webhooks/twilio/status" },
            ].map((w) => (
              <div key={w.path}>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">{w.label}</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-xs text-gray-700 break-all">
                    {appUrl}{w.path}
                  </code>
                  <button
                    type="button"
                    onClick={() => navigator.clipboard.writeText(`${appUrl}${w.path}`)}
                    className="shrink-0 text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-2.5 rounded-lg transition-colors"
                  >
                    Copy
                  </button>
                </div>
              </div>
            ))}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
              Also enable <strong>Advanced Opt-Out</strong> in your Messaging Service for automatic STOP/START/HELP handling.
            </div>
          </div>
        )}

        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={status === "saving" || activeTab === "webhooks"}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium text-sm hover:bg-blue-500 transition-colors disabled:opacity-50"
          >
            {status === "saving" ? "Saving..." : "Save Settings"}
          </button>
          {status === "saved" && <span className="text-green-600 text-sm font-medium">✓ Saved</span>}
          {status === "error" && <span className="text-red-600 text-sm">Failed to save</span>}
          {form.updatedAt && status === "idle" && (
            <span className="text-gray-400 text-xs">Last saved: {new Date(form.updatedAt).toLocaleString()}</span>
          )}
        </div>
      </form>
    </div>
  );
}
