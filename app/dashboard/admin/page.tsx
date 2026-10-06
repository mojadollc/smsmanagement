"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";

const SystemSettings = dynamic(() => import("@/components/admin/SystemSettings"), { ssr: false });
const WebhooksTab = dynamic(() => import("@/components/admin/WebhooksTab"), { ssr: false });

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  lastLoginIp: string | null;
  loginCity: string | null;
  loginRegion: string | null;
  loginCountry: string | null;
}

const EMPTY_ADD = { name: "", email: "", password: "", role: "agent" };
const EMPTY_EDIT = { name: "", role: "agent", active: true, password: "" };

function Avatar({ name, email }: { name: string; email: string }) {
  const initials = name
    ? name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : email[0]?.toUpperCase() ?? "?";
  const colors = [
    ["#3b82f6", "#1d4ed8"], ["#8b5cf6", "#6d28d9"], ["#10b981", "#047857"],
    ["#f59e0b", "#b45309"], ["#ef4444", "#b91c1c"], ["#06b6d4", "#0e7490"],
  ];
  const [bg, fg] = colors[(name + email).length % colors.length];
  return (
    <div
      className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
      style={{ background: `linear-gradient(135deg, ${bg}, ${fg})` }}
    >
      {initials}
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl shadow-2xl" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
          <h3 className="font-semibold text-base" style={{ color: "var(--text)" }}>{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg transition-colors" style={{ color: "var(--text-3)" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-2)" }}>{label}</label>
      {children}
      {hint && <p className="text-xs mt-1" style={{ color: "var(--text-3)" }}>{hint}</p>}
    </div>
  );
}

function formatLocation(user: User): string | null {
  const parts = [user.loginCity, user.loginRegion, user.loginCountry].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : null;
}

function formatLastLogin(user: User): string {
  if (!user.lastLoginAt) return "Never";
  const date = new Date(user.lastLoginAt);
  const location = formatLocation(user);
  const ip = user.lastLoginIp || "";
  return `${date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}${location ? ` · ${location}` : ""}${ip && ip !== "127.0.0.1" ? ` · ${ip}` : ""}`;
}

const TABS = [
  { id: "users", label: "Users" },
  { id: "settings", label: "System Settings" },
  { id: "webhooks", label: "Webhooks" },
] as const;

type Tab = typeof TABS[number]["id"];

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>("users");
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [deleteUser, setDeleteUser] = useState<User | null>(null);
  const [addForm, setAddForm] = useState(EMPTY_ADD);
  const [editForm, setEditForm] = useState(EMPTY_EDIT);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/users");
    if (res.ok) setUsers(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError("");
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(addForm),
    });
    if (res.ok) { setShowAdd(false); setAddForm(EMPTY_ADD); load(); }
    else { const d = await res.json(); setError(d.error || "Failed to create user"); }
    setSaving(false);
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editUser) return;
    setSaving(true); setError("");
    const body: Record<string, unknown> = { name: editForm.name, role: editForm.role, active: editForm.active };
    if (editForm.password) body.password = editForm.password;
    const res = await fetch(`/api/admin/users/${editUser.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) { setEditUser(null); setEditForm(EMPTY_EDIT); load(); }
    else setError("Failed to update user");
    setSaving(false);
  }

  async function handleDelete() {
    if (!deleteUser) return;
    setDeleting(true);
    await fetch(`/api/admin/users/${deleteUser.id}`, { method: "DELETE" });
    setDeleteUser(null); setDeleting(false); load();
  }

  function openEdit(u: User) {
    setEditUser(u);
    setEditForm({ name: u.name, role: u.role, active: u.active, password: "" });
    setError("");
  }

  const inputCls = "input text-sm";

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>Admin Panel</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-2)" }}>Manage users and system configuration</p>
        </div>
        {tab === "users" && (
          <button onClick={() => { setShowAdd(true); setError(""); }} className="btn-primary flex items-center gap-2 px-4 py-2.5">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add User
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)" }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              background: tab === t.id ? "var(--bg-card)" : "transparent",
              color: tab === t.id ? "var(--text)" : "var(--text-3)",
              boxShadow: tab === t.id ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Users Tab */}
      {tab === "users" && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Total Users", value: users.length, color: "var(--text)" },
              { label: "Active", value: users.filter((u) => u.active).length, color: "#16a34a" },
              { label: "Admins", value: users.filter((u) => u.role === "admin").length, color: "#9333ea" },
            ].map((s) => (
              <div key={s.label} className="card p-4" style={{ background: "var(--bg-card)" }}>
                <p className="text-xs font-medium uppercase tracking-wide mb-1" style={{ color: "var(--text-3)" }}>{s.label}</p>
                <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Table */}
          <div className="card overflow-hidden" style={{ background: "var(--bg-card)" }}>
            <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
              <h2 className="font-semibold" style={{ color: "var(--text)" }}>Users</h2>
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <svg className="w-5 h-5 animate-spin" style={{ color: "var(--text-3)" }} fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-subtle)" }}>
                      {["User", "Role", "Status", "Last Login", "Actions"].map((h) => (
                        <th key={h} className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-3)" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} style={{ borderBottom: "1px solid var(--border-soft)" }}>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <Avatar name={u.name} email={u.email} />
                            <div className="min-w-0">
                              <p className="font-medium truncate" style={{ color: "var(--text)" }}>{u.name || "—"}</p>
                              <p className="text-xs truncate" style={{ color: "var(--text-3)" }}>{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium"
                            style={u.role === "admin"
                              ? { background: "rgba(168,85,247,0.12)", color: "#9333ea" }
                              : { background: "var(--bg-subtle)", color: "var(--text-2)" }}>
                            {u.role}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium"
                            style={u.active
                              ? { background: "rgba(34,197,94,0.12)", color: "#16a34a" }
                              : { background: "rgba(239,68,68,0.12)", color: "#dc2626" }}>
                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: u.active ? "#16a34a" : "#dc2626" }} />
                            {u.active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <p className="text-xs" style={{ color: "var(--text-2)" }}>{formatLastLogin(u)}</p>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1">
                            <button onClick={() => openEdit(u)}
                              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                              style={{ color: "var(--accent)", background: "transparent" }}
                              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--accent-soft)")}
                              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              Edit
                            </button>
                            <button onClick={() => setDeleteUser(u)}
                              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                              style={{ color: "#dc2626", background: "transparent" }}
                              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(239,68,68,0.08)")}
                              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {tab === "settings" && <SystemSettings />}
      {tab === "webhooks" && <WebhooksTab />}

      {/* Add User Modal */}
      {showAdd && (
        <Modal title="Add New User" onClose={() => { setShowAdd(false); setError(""); setAddForm(EMPTY_ADD); }}>
          <form onSubmit={handleAdd} className="space-y-4">
            {error && <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#dc2626" }}>{error}</div>}
            <Field label="Full Name"><input required className={inputCls} placeholder="Jane Smith" value={addForm.name} onChange={(e) => setAddForm({ ...addForm, name: e.target.value })} /></Field>
            <Field label="Email Address"><input required type="email" className={inputCls} placeholder="jane@example.com" value={addForm.email} onChange={(e) => setAddForm({ ...addForm, email: e.target.value })} /></Field>
            <Field label="Password" hint="Minimum 8 characters"><input required type="password" className={inputCls} placeholder="••••••••" value={addForm.password} onChange={(e) => setAddForm({ ...addForm, password: e.target.value })} /></Field>
            <Field label="Role">
              <select className={inputCls} value={addForm.role} onChange={(e) => setAddForm({ ...addForm, role: e.target.value })}>
                <option value="agent">Agent — can send SMS and manage conversations</option>
                <option value="admin">Admin — full access including settings</option>
              </select>
            </Field>
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={() => { setShowAdd(false); setError(""); setAddForm(EMPTY_ADD); }} className="btn-ghost flex-1 py-2.5">Cancel</button>
              <button type="submit" disabled={saving} className="btn-primary flex-1 py-2.5">
                {saving ? "Creating..." : "Create User"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit User Modal */}
      {editUser && (
        <Modal title="Edit User" onClose={() => { setEditUser(null); setError(""); }}>
          <form onSubmit={handleEdit} className="space-y-4">
            {error && <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#dc2626" }}>{error}</div>}
            <div className="px-3 py-3 rounded-lg" style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)" }}>
              <div className="flex items-center gap-3">
                <Avatar name={editUser.name} email={editUser.email} />
                <div>
                  <p className="text-sm font-medium" style={{ color: "var(--text)" }}>{editUser.name}</p>
                  <p className="text-xs" style={{ color: "var(--text-3)" }}>{editUser.email}</p>
                </div>
              </div>
            </div>
            <Field label="Full Name"><input required className={inputCls} value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} /></Field>
            <Field label="Role">
              <select className={inputCls} value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}>
                <option value="agent">Agent</option>
                <option value="admin">Admin</option>
              </select>
            </Field>
            <Field label="Status">
              <select className={inputCls} value={editForm.active ? "true" : "false"} onChange={(e) => setEditForm({ ...editForm, active: e.target.value === "true" })}>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </Field>
            <Field label="New Password" hint="Leave blank to keep current password">
              <input type="password" className={inputCls} placeholder="••••••••" value={editForm.password} onChange={(e) => setEditForm({ ...editForm, password: e.target.value })} />
            </Field>
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={() => { setEditUser(null); setError(""); }} className="btn-ghost flex-1 py-2.5">Cancel</button>
              <button type="submit" disabled={saving} className="btn-primary flex-1 py-2.5">
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirm Modal */}
      {deleteUser && (
        <Modal title="Delete User" onClose={() => setDeleteUser(null)}>
          <div className="space-y-4">
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg" style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)" }}>
              <Avatar name={deleteUser.name} email={deleteUser.email} />
              <div>
                <p className="text-sm font-medium" style={{ color: "var(--text)" }}>{deleteUser.name}</p>
                <p className="text-xs" style={{ color: "var(--text-3)" }}>{deleteUser.email}</p>
              </div>
            </div>
            <p className="text-sm" style={{ color: "var(--text-2)" }}>This will permanently delete this user account. This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteUser(null)} className="btn-ghost flex-1 py-2.5">Cancel</button>
              <button onClick={handleDelete} disabled={deleting}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                style={{ background: "#dc2626" }}>
                {deleting ? "Deleting..." : "Delete User"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
