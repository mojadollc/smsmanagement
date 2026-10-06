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
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileForm, setProfileForm] = useState({ name: "", email: "", currentPassword: "", newPassword: "" });
  const [profileStatus, setProfileStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.ok ? r.json() : null).then((d) => {
      if (d) {
        setProfile(d);
        setProfileForm({ name: d.name || "", email: d.email || "", currentPassword: "", newPassword: "" });
      }
    });
  }, []);

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

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>Settings</h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--text-2)" }}>Manage your account preferences</p>
      </div>

      {profile && (
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
    </div>
  );
}
