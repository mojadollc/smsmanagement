"use client";

import { useState, useEffect } from "react";

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--text-3)" }}>
        {label}
      </label>
      <div className="flex items-center gap-2">
        <code
          className="flex-1 text-sm px-3 py-2 rounded-lg font-mono truncate"
          style={{ background: "var(--bg-subtle)", color: "var(--text-2)", border: "1px solid var(--border)" }}
        >
          {value || <span style={{ color: "var(--text-3)" }}>Set App URL in System Settings first</span>}
        </code>
        {value && (
          <button
            onClick={copy}
            className="shrink-0 px-3 py-2 rounded-lg text-xs font-medium transition-colors"
            style={{
              background: copied ? "rgba(34,197,94,0.12)" : "var(--bg-subtle)",
              color: copied ? "#16a34a" : "var(--text-2)",
              border: "1px solid var(--border)",
            }}
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        )}
      </div>
    </div>
  );
}

export default function WebhooksTab() {
  const [appUrl, setAppUrl] = useState("");

  useEffect(() => {
    fetch("/api/settings").then((r) => r.ok ? r.json() : null).then((d) => {
      if (d?.appUrl) setAppUrl(d.appUrl.replace(/\/$/, ""));
    });
  }, []);

  const incomingUrl = appUrl ? `${appUrl}/api/webhooks/twilio/incoming` : "";
  const statusUrl = appUrl ? `${appUrl}/api/webhooks/twilio/status` : "";

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="card p-6 space-y-5" style={{ background: "var(--bg-card)" }}>
        <div style={{ borderBottom: "1px solid var(--border)", paddingBottom: "0.75rem" }}>
          <p className="font-semibold" style={{ color: "var(--text)" }}>Twilio Webhook URLs</p>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-2)" }}>
            Configure these in your Twilio Messaging Service settings.
          </p>
        </div>
        <CopyField label="Incoming Message Webhook (POST)" value={incomingUrl} />
        <CopyField label="Status Callback (POST)" value={statusUrl} />
      </div>

      <div className="card p-6 space-y-4" style={{ background: "var(--bg-card)" }}>
        <div style={{ borderBottom: "1px solid var(--border)", paddingBottom: "0.75rem" }}>
          <p className="font-semibold" style={{ color: "var(--text)" }}>Setup Instructions</p>
        </div>
        <ol className="space-y-3 text-sm" style={{ color: "var(--text-2)" }}>
          {[
            "Go to Twilio Console → Messaging → Services → your Messaging Service.",
            "Under Integration, set the Incoming Message webhook to the URL above (HTTP POST).",
            "Set the Status Callback URL to the status URL above.",
            'Enable Advanced Opt-Out to handle STOP / START / HELP automatically.',
            "Make sure your App URL in System Settings matches your public domain.",
          ].map((step, i) => (
            <li key={i} className="flex gap-3">
              <span
                className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white"
                style={{ background: "var(--accent)", marginTop: "1px" }}
              >
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </div>

      <div className="card p-6 space-y-3" style={{ background: "var(--bg-card)" }}>
        <div style={{ borderBottom: "1px solid var(--border)", paddingBottom: "0.75rem" }}>
          <p className="font-semibold" style={{ color: "var(--text)" }}>Opt-Out Handling</p>
        </div>
        <div className="space-y-2 text-sm" style={{ color: "var(--text-2)" }}>
          {[
            { keyword: "STOP", desc: "Sets customer smsOptOut = true, blocks future sends" },
            { keyword: "START", desc: "Re-enables SMS consent for the customer" },
            { keyword: "HELP", desc: "Logged only, no action taken" },
          ].map(({ keyword, desc }) => (
            <div key={keyword} className="flex items-center gap-3">
              <code
                className="shrink-0 text-xs px-2 py-0.5 rounded font-mono font-bold"
                style={{ background: "var(--bg-subtle)", color: "var(--accent)" }}
              >
                {keyword}
              </code>
              <span>{desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
