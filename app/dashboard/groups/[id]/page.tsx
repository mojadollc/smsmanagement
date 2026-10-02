"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
}

interface GroupDetail {
  id: string;
  name: string;
  description?: string;
  members: Customer[];
}

export default function GroupDetailPage() {
  const router = useRouter();
  const params = useParams();
  const groupId = params.id as string;

  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [availableCustomers, setAvailableCustomers] = useState<Customer[]>([]);
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchGroup();
    fetchCustomers();
  }, [groupId]);

  async function fetchGroup() {
    setLoading(true);
    const res = await fetch(`/api/groups/${groupId}`);
    if (res.ok) setGroup(await res.json());
    setLoading(false);
  }

  async function fetchCustomers() {
    const res = await fetch("/api/customers?limit=1000");
    if (res.ok) {
      const data = await res.json();
      setAvailableCustomers(data.customers || []);
    }
  }

  const filteredAvailable = availableCustomers.filter(c => {
    if (!search) return true;
    const query = search.toLowerCase();
    return `${c.firstName} ${c.lastName} ${c.phone}`.toLowerCase().includes(query);
  });

  async function addMembers() {
    if (selectedCustomers.length === 0) return;
    setSaving(true);
    
    const res = await fetch(`/api/groups/${groupId}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customerIds: selectedCustomers }),
    });

    if (res.ok) {
      setShowAddModal(false);
      setSelectedCustomers([]);
      fetchGroup();
    }
    setSaving(false);
  }

  async function removeMember(customerId: string) {
    const res = await fetch(`/api/groups/${groupId}/members?customerId=${customerId}`, {
      method: "DELETE",
    });
    if (res.ok) fetchGroup();
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 rounded animate-pulse" style={{ background: "var(--bg-subtle)" }} />
        <div className="card p-6" style={{ background: "var(--bg-card)" }}>
          <div className="h-5 w-32 rounded animate-pulse" style={{ background: "var(--bg-subtle)" }} />
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="text-center py-12">
        <p style={{ color: "var(--text-2)" }}>Group not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 rounded-lg" style={{ color: "var(--text-3)" }}>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>{group.name}</h1>
          {group.description && <p className="text-sm mt-0.5" style={{ color: "var(--text-2)" }}>{group.description}</p>}
        </div>
        <button onClick={() => setShowAddModal(true)} className="btn-primary px-4 py-2.5 text-sm font-medium">
          + Add Members
        </button>
      </div>

      {/* Members List */}
      <div className="card p-0" style={{ background: "var(--bg-card)" }}>
        <div className="px-5 py-3 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border)" }}>
          <h2 className="font-semibold" style={{ color: "var(--text)" }}>Members ({group.members.length})</h2>
        </div>
        
        {group.members.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: "var(--bg-subtle)" }}>
              <svg className="w-6 h-6" style={{ color: "var(--text-3)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <p className="font-medium mb-1" style={{ color: "var(--text)" }}>No members yet</p>
            <p className="text-sm" style={{ color: "var(--text-2)" }}>Add customers to this group</p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: "var(--border)" }}>
            {group.members.map(c => (
              <div key={c.id} className="px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold text-white" style={{ background: "linear-gradient(135deg, #3b82f6, #6366f1)" }}>
                    {c.firstName[0]}{c.lastName[0]}
                  </div>
                  <div>
                    <p className="font-medium text-sm" style={{ color: "var(--text)" }}>{c.firstName} {c.lastName}</p>
                    <p className="text-xs" style={{ color: "var(--text-3)" }}>{c.phone}</p>
                  </div>
                </div>
                <button
                  onClick={() => removeMember(c.id)}
                  className="p-2 rounded-lg transition-colors"
                  style={{ color: "#dc2626" }}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Members Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !saving && setShowAddModal(false)} />
          <div className="relative card p-6 w-full max-w-lg shadow-2xl max-h-[80vh] flex flex-col" style={{ background: "var(--bg-card)" }}>
            <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--text)" }}>Add Members</h3>
            
            <input
              className="input mb-3"
              placeholder="Search customers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <div className="flex-1 overflow-y-auto rounded-lg mb-4" style={{ border: "1px solid var(--border)" }}>
              <div className="px-3 py-2 flex gap-3" style={{ background: "var(--bg-subtle)", borderBottom: "1px solid var(--border)" }}>
                <button
                  type="button"
                  className="text-xs font-medium"
                  style={{ color: "var(--accent)" }}
                  onClick={() => setSelectedCustomers(filteredAvailable.map(c => c.id))}
                >
                  Select All
                </button>
                <button
                  type="button"
                  className="text-xs"
                  style={{ color: "var(--text-3)" }}
                  onClick={() => setSelectedCustomers([])}
                >
                  Clear
                </button>
                <span className="ml-auto text-xs" style={{ color: "var(--text-2)" }}>{selectedCustomers.length} selected</span>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {filteredAvailable.map(c => {
                  const selected = selectedCustomers.includes(c.id);
                  const alreadyInGroup = group.members.some(m => m.id === c.id);
                  return (
                    <label
                      key={c.id}
                      className={`flex items-center gap-3 px-3 py-2 cursor-pointer text-sm ${alreadyInGroup ? 'opacity-50' : ''}`}
                      style={{ borderBottom: "1px solid var(--border-soft)" }}
                    >
                      <input
                        type="checkbox"
                        className="rounded"
                        disabled={alreadyInGroup}
                        checked={selected || alreadyInGroup}
                        onChange={(e) => setSelectedCustomers(e.target.checked ? [...selectedCustomers, c.id] : selectedCustomers.filter(id => id !== c.id))}
                      />
                      <span className="font-medium" style={{ color: "var(--text)" }}>{c.firstName} {c.lastName}</span>
                      <span className="text-xs ml-auto" style={{ color: "var(--text-3)" }}>{c.phone}</span>
                      {alreadyInGroup && <span className="text-xs" style={{ color: "var(--accent)" }}>Already in group</span>}
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setShowAddModal(false)} disabled={saving} className="btn-ghost flex-1">Cancel</button>
              <button onClick={addMembers} disabled={saving || selectedCustomers.length === 0} className="btn-primary flex-1">
                {saving ? "Adding..." : `Add ${selectedCustomers.length} Members`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
