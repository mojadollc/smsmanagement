"use client";

import { useState, useEffect } from "react";

interface SettingsData {
  twilioAccountSid: string;
  twilioAuthToken: string;
  twilioMessagingServiceSid: string;
  dailyLimit: number;
  appUrl: string;
  updatedAt?: string;
}

export default function SettingsPage() {
  const [form, setForm] = useState<SettingsData>({
    twilioAccountSid: "",
    twilioAuthToken: "",
    twilioMessagingServiceSid: "",
    dailyLimit: 200,
    appUrl: "",
  });
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [showToken, setShowToken] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => setForm(data));
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

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>

      <form onSubmit={save} className="space-y-6">

        {/* Twilio */}
        <div className="bg-white border rounded-lg p-5 space-y-4">
          <h2 className="font-semibold text-gray-800">Twilio Configuration</h2>

          <div>
            <label className="block text-sm font-medium mb-1">Account SID</label>
            <input
              className="w-full border rounded-md px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              value={form.twilioAccountSid}
              onChange={(e) => set("twilioAccountSid", e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Auth Token</label>
            <div className="relative">
              <input
                type={showToken ? "text" : "password"}
                className="w-full border rounded-md px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 pr-16"
                placeholder="••••••••••••••••••••••••••••••••"
                value={form.twilioAuthToken}
                onChange={(e) => set("twilioAuthToken", e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600"
              >
                {showToken ? "Hide" : "Show"}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1">Leave unchanged to keep existing token.</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Messaging Service SID</label>
            <input
              className="w-full border rounded-md px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              value={form.twilioMessagingServiceSid}
              onChange={(e) => set("twilioMessagingServiceSid", e.target.value)}
            />
          </div>
        </div>

        {/* General */}
        <div className="bg-white border rounded-lg p-5 space-y-4">
          <h2 className="font-semibold text-gray-800">General</h2>

          <div>
            <label className="block text-sm font-medium mb-1">Daily SMS Limit</label>
            <input
              type="number"
              min={1}
              className="w-32 border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.dailyLimit}
              onChange={(e) => set("dailyLimit", Number(e.target.value))}
            />
            <p className="text-xs text-gray-400 mt-1">Max outbound SMS per day across all campaigns.</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">App URL</label>
            <input
              className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://sms.beegoo.app"
              value={form.appUrl}
              onChange={(e) => set("appUrl", e.target.value)}
            />
          </div>
        </div>

        {/* Webhook URLs (read-only reference) */}
        <div className="bg-white border rounded-lg p-5 space-y-3">
          <h2 className="font-semibold text-gray-800">Twilio Webhook URLs</h2>
          <p className="text-sm text-gray-500">Configure these in your Twilio Messaging Service:</p>

          <div>
            <span className="text-xs font-medium text-gray-500 uppercase">Incoming Message</span>
            <div className="flex items-center gap-2 mt-1">
              <code className="flex-1 bg-gray-50 border rounded px-3 py-2 text-xs break-all">
                {appUrl}/api/webhooks/twilio/incoming
              </code>
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(`${appUrl}/api/webhooks/twilio/incoming`)}
                className="text-xs text-blue-600 hover:underline whitespace-nowrap"
              >
                Copy
              </button>
            </div>
          </div>

          <div>
            <span className="text-xs font-medium text-gray-500 uppercase">Status Callback</span>
            <div className="flex items-center gap-2 mt-1">
              <code className="flex-1 bg-gray-50 border rounded px-3 py-2 text-xs break-all">
                {appUrl}/api/webhooks/twilio/status
              </code>
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(`${appUrl}/api/webhooks/twilio/status`)}
                className="text-xs text-blue-600 hover:underline whitespace-nowrap"
              >
                Copy
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={status === "saving"}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-md font-medium disabled:opacity-50"
          >
            {status === "saving" ? "Saving..." : "Save Settings"}
          </button>
          {status === "saved" && <span className="text-green-600 text-sm">✓ Settings saved</span>}
          {status === "error" && <span className="text-red-600 text-sm">Failed to save</span>}
          {form.updatedAt && status === "idle" && (
            <span className="text-gray-400 text-xs">
              Last saved: {new Date(form.updatedAt).toLocaleString()}
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
