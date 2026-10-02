"use client";

import { useState, useEffect } from "react";

interface User { id: string; name: string; email: string; role: string; active: boolean; createdAt: string; }

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "agent" });
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", role: "agent", active: true, password: "" });
  const [saving, setSaving] = useState(false);

  async function load() {
    const res = await fetch("/api/admin/users");
    if (res.ok) setUsers(await res.json());
  }

  useEffect(() => { load(); }, []);

  async function addUser(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) { setShowAdd(false); setForm({ name: "", email: "", password: "", role: "agent" }); load(); }
    setSaving(false);
  }

  async function updateUser(id: string) {
    setSaving(true);
    const body: Record<string, unknown> = { name: editForm.name, role: editForm.role, active: editForm.active };
    if (editForm.password) body.password = editForm.password;
    await fetch(`/api/admin/users/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setEditId(null);
    load();
    setSaving(false);
  }

  async function deleteUser(id: string) {
    if (!confirm("Delete this user?")) return;
    await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    load();
  }

  const inputCls = "input text-sm";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>Admin Panel</h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--text-2)" }}>Manage users and system access</p>
      </div>

      <div className="card overflow-hidden" style={{ background: "var(--bg-card)" }}>
        {/* Header */}
        <div className="flex justify-between items-center px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
          <h2 className="font-semibold" style={{ color: "var(--text)" }}>Users</h2>
          <button onClick={() => setShowAdd(true)} className="btn-primary text-sm px-4 py-2">
            + Add User
          </button>
        </div>

        {/* Add user form */}
        {showAdd && (
          <form onSubmit={addUser} className="px-5 py-4" style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-subtle)" }}>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <input required placeholder="Full Name" className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <input required type="email" placeholder="Email" className={inputCls} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              <input required type="password" placeholder="Password" className={inputCls} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              <select className={inputCls} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                <option value="agent">Agent</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={saving} className="btn-primary text-sm px-4 py-2 disabled:opacity-50">Save</button>
              <button type="button" onClick={() => setShowAdd(false)} className="btn-ghost text-sm px-4 py-2">Cancel</button>
            </div>
          </form>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-subtle)" }}>
                {["Name", "Email", "Role", "Status", ""].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-3)" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} style={{ borderBottom: "1px solid var(--border-soft)" }}>
                  {editId === u.id ? (
                    <>
                      <td className="px-5 py-3">
                        <input className={inputCls} value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
                      </td>
                      <td className="px-5 py-3 text-sm" style={{ color: "var(--text-3)" }}>{u.email}</td>
                      <td className="px-5 py-3">
                        <select className={inputCls} value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}>
                          <option value="agent">Agent</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="px-5 py-3">
                        <select className={inputCls} value={editForm.active ? "true" : "false"} onChange={(e) => setEditForm({ ...editForm, active: e.target.value === "true" })}>
                          <option value="true">Active</option>
                          <option value="false">Inactive</option>
                        </select>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex gap-2">
                          <button onClick={() => updateUser(u.id)} disabled={saving} className="btn-primary text-xs px-3 py-1.5 disabled:opacity-50">Save</button>
                          <button onClick={() => setEditId(null)} className="btn-ghost text-xs px-3 py-1.5">Cancel</button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-5 py-3 font-medium" style={{ color: "var(--text)" }}>{u.name}</td>
                      <td className="px-5 py-3" style={{ color: "var(--text-2)" }}>{u.email}</td>
                      <td className="px-5 py-3">
                        <span
                          className="text-xs px-2.5 py-1 rounded-full font-medium"
                          style={
                            u.role === "admin"
                              ? { background: "rgba(168,85,247,0.12)", color: "#9333ea" }
                              : { background: "var(--bg-subtle)", color: "var(--text-2)" }
                          }
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className="text-xs px-2.5 py-1 rounded-full font-medium"
                          style={
                            u.active
                              ? { background: "rgba(34,197,94,0.12)", color: "#16a34a" }
                              : { background: "rgba(239,68,68,0.12)", color: "#dc2626" }
                          }
                        >
                          {u.active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex gap-3">
                          <button
                            onClick={() => { setEditId(u.id); setEditForm({ name: u.name, role: u.role, active: u.active, password: "" }); }}
                            className="text-xs font-medium"
                            style={{ color: "var(--accent)" }}
                          >
                            Edit
                          </button>
                          <button onClick={() => deleteUser(u.id)} className="text-xs font-medium" style={{ color: "#dc2626" }}>
                            Delete
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
