"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  smsOptIn: boolean;
  smsOptOut: boolean;
  createdAt: string;
}

export default function CustomerList() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ firstName: "", lastName: "", phone: "", email: "" });

  async function load() {
    const res = await fetch(`/api/customers?search=${search}&page=${page}&limit=20`);
    const data = await res.json();
    setCustomers(data.customers);
    setTotal(data.total);
  }

  useEffect(() => { load(); }, [search, page]);

  async function addCustomer(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setShowAdd(false);
      setForm({ firstName: "", lastName: "", phone: "", email: "" });
      load();
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <input
          className="border rounded-md px-3 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Search customers..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
        <button
          onClick={() => setShowAdd(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm"
        >
          + Add Customer
        </button>
      </div>

      {showAdd && (
        <form onSubmit={addCustomer} className="bg-white border rounded-lg p-4 mb-4 grid grid-cols-2 gap-3">
          <input required placeholder="First Name" className="border rounded px-3 py-2 text-sm" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
          <input required placeholder="Last Name" className="border rounded px-3 py-2 text-sm" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
          <input required placeholder="Phone (+1...)" className="border rounded px-3 py-2 text-sm" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <input placeholder="Email" className="border rounded px-3 py-2 text-sm" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <div className="col-span-2 flex gap-2 justify-end">
            <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 text-sm border rounded-md">Cancel</button>
            <button type="submit" className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md">Save</button>
          </div>
        </form>
      )}

      <div className="bg-white border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Phone</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">SMS Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{c.firstName} {c.lastName}</td>
                <td className="px-4 py-3 text-gray-600">{c.phone}</td>
                <td className="px-4 py-3 text-gray-600">{c.email ?? "—"}</td>
                <td className="px-4 py-3">
                  {c.smsOptOut ? (
                    <span className="text-red-600 text-xs font-medium">🚫 Opted Out</span>
                  ) : c.smsOptIn ? (
                    <span className="text-green-600 text-xs font-medium">✓ Opted In</span>
                  ) : (
                    <span className="text-gray-400 text-xs">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <Link href={`/dashboard/customers/${c.id}`} className="text-blue-600 text-xs hover:underline">View</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="p-3 flex justify-between items-center text-sm text-gray-500">
          <span>{total} customers</span>
          <div className="flex gap-2">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-2 py-1 border rounded disabled:opacity-40">←</button>
            <button disabled={page * 20 >= total} onClick={() => setPage(p => p + 1)} className="px-2 py-1 border rounded disabled:opacity-40">→</button>
          </div>
        </div>
      </div>
    </div>
  );
}
