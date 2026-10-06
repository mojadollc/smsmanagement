"use client";

import { useState, useEffect } from "react";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
}

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

export default function SettingsPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [form, setForm] = useState({ name: "", currentPassword: "", newPassword: "" });
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.ok ? r.json() : null).then((d) => {
      if (d) {
        setProfile(d);
        setForm((prev) => ({ ...prev, name: d.name || "" }));
      }
    });
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving");
    setErrorMsg("");
    const body: Record<string, string> = { name: form.name };
    if (form.newPassword) {
      body.currentPassword = form.currentPassword;
      body.newPassword = form.newPassword;
    }
    const res = await fetch("/api/user/update", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (res.ok) {
      setStatus("saved");
      if (data.user) setProfile(data.user);
      setForm((prev) => ({ ...prev, currentPassword: "", newPassword: "" }));
    } else {
      setStatus("error");
      setErrorMsg(data.error || "Failed to save");
    }
    setTimeout(() => setStatus("idle"), 3000);
  }

  if (!profile) return null;

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>My Profile</h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--text-2)" }}>Update your name and password</p>
      </div>

      <form onSubmit={handleSave}>
        <SectionCard title="Account Settings">
          <Field label="Full Name">
            <input
              className="input"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              required
            />
          </Field>
          <Field label="Email">
            <input className="input" value={profile.email} disabled style={{ opacity: 0.6, cursor: "not-allowed" }} />
          </Field>
          <Field label="Role">
            <input className="input" value={profile.role === "admin" ? "Administrator" : "Agent"} disabled style={{ opacity: 0.6, cursor: "not-allowed" }} />
          </Field>

          <div style={{ borderTop: "1px solid var(--border)", paddingTop: "1rem", marginTop: "0.5rem" }}>
            <p className="font-medium mb-4 text-sm" style={{ color: "var(--text)" }}>Change Password</p>
            <div className="space-y-4">
              <Field label="Current Password" hint="Required only if changing password">
                <input
                  type="password"
                  className="input"
                  value={form.currentPassword}
                  onChange={(e) => setForm((p) => ({ ...p, currentPassword: e.target.value }))}
                  placeholder="Enter current password"
                />
              </Field>
              <Field label="New Password" hint="Minimum 8 characters">
                <input
                  type="password"
                  className="input"
                  value={form.newPassword}
                  onChange={(e) => setForm((p) => ({ ...p, newPassword: e.target.value }))}
                  placeholder="Enter new password"
                />
              </Field>
            </div>
          </div>

          {errorMsg && (
            <p className="text-sm" style={{ color: "#dc2626" }}>{errorMsg}</p>
          )}

          <div className="flex items-center gap-4 pt-1">
            <button type="submit" disabled={status === "saving"} className="btn-primary px-6 py-2.5">
              {status === "saving" ? "Saving..." : "Save Changes"}
            </button>
            {status === "saved" && (
              <span className="flex items-center gap-1.5 text-sm font-medium" style={{ color: "#16a34a" }}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Saved
              </span>
            )}
          </div>
        </SectionCard>
      </form>
    </div>
  );
}
