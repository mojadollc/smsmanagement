"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Group {
  id: string;
  name: string;
  description?: string;
  memberCount: number;
  createdAt: string;
}

export default function GroupsPage() {
  const router = useRouter();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [form, setForm] = useState({ name: "", description: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchGroups();
  }, []);

  async function fetchGroups() {
    setLoading(true);
    const res = await fetch("/api/groups");
    if (res.ok) setGroups(await res.json());
    setLoading(false);
  }

  function openCreate() {
    setEditingGroup(null);
    setForm({ name: "", description: "" });
    setShowModal(true);
  }

  function openEdit(g: Group) {
    setEditingGroup(g);
    setForm({ name: g.name, description: g.description || "" });
    setShowModal(true);
  }

  async function saveGroup(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    
    const url = editingGroup ? `/api/groups/${editingGroup.id}` : "/api/groups";
    const method = editingGroup ? "PUT" : "POST";
    
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      setShowModal(false);
      fetchGroups();
    }
    setSaving(false);
  }

  async function deleteGroup(id: string) {
    if (!confirm("Delete this group? Members will not be deleted.")) return;
    await fetch(`/api/groups/${id}`, { method: "DELETE" });
    fetchGroups();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>Customer Groups</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-2)" }}>Organize customers into groups for easier campaign targeting</p>
        </div>
        <button onClick={openCreate} className="btn-primary px-4 py-2.5 text-sm font-medium">
          + New Group
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="card p-5" style={{ background: "var(--bg-card)" }}>
              <div className="h-5 w-40 rounded animate-pulse" style={{ background: "var(--bg-subtle)" }} />
            </div>
          ))}
        </div>
      ) : groups.length === 0 ? (
        <div className="card p-12 text-center" style={{ background: "var(--bg-card)" }}>
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "var(--bg-subtle)" }}>
            <svg className="w-8 h-8" style={{ color: "var(--text-3)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <p className="font-medium mb-1" style={{ color: "var(--text)" }}>No groups yet</p>
          <p className="text-sm mb-4" style={{ color: "var(--text-2)" }}>Create groups to organize your customers</p>
          <button onClick={openCreate} className="btn-primary px-4 py-2 text-sm">Create First Group</button>
        </div>
      ) : (
        <div className="grid gap-3">
          {groups.map(g => (
            <div key={g.id} className="card p-5 flex items-center justify-between" style={{ background: "var(--bg-card)" }}>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "var(--accent-soft)" }}>
                  <svg className="w-5 h-5" style={{ color: "var(--accent)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold" style={{ color: "var(--text)" }}>{g.name}</p>
                  {g.description && <p className="text-sm" style={{ color: "var(--text-2)" }}>{g.description}</p>}
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-lg font-bold" style={{ color: "var(--accent)" }}>{g.memberCount}</p>
                  <p className="text-xs" style={{ color: "var(--text-3)" }}>members</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => router.push(`/dashboard/groups/${g.id}`)}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                    style={{ background: "var(--bg-subtle)", color: "var(--text-2)" }}
                  >
                    Manage
                  </button>
                  <button
                    onClick={() => openEdit(g)}
                    className="p-2 rounded-lg transition-colors"
                    style={{ color: "var(--text-3)" }}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => deleteGroup(g.id)}
                    className="p-2 rounded-lg transition-colors"
                    style={{ color: "#dc2626" }}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !saving && setShowModal(false)} />
          <div className="relative card p-6 w-full max-w-md shadow-2xl" style={{ background: "var(--bg-card)" }}>
            <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--text)" }}>
              {editingGroup ? "Edit Group" : "Create New Group"}
            </h3>
            <form onSubmit={saveGroup} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-2)" }}>Group Name</label>
                <input
                  required
                  className="input"
                  placeholder="e.g., VIP Customers, Newsletter Subscribers"
                  value={form.name}
                  onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-2)" }}>Description (optional)</label>
                <textarea
                  rows={2}
                  className="input resize-none"
                  placeholder="Brief description of this group"
                  value={form.description}
                  onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} disabled={saving} className="btn-ghost flex-1">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1">
                  {saving ? "Saving..." : editingGroup ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
