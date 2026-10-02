"use client";

import { useState, useEffect, useRef } from "react";
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

type Tab = "list" | "add" | "import";

export default function CustomerList() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [tab, setTab] = useState<Tab>("list");

  // Add form
  const [form, setForm] = useState({ firstName: "", lastName: "", phone: "", email: "" });
  const [addStatus, setAddStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [addError, setAddError] = useState("");

  // CSV import
  const fileRef = useRef<HTMLInputElement>(null);
  const [csvRows, setCsvRows] = useState<{ firstName: string; lastName: string; phone: string; email: string }[]>([]);
  const [csvError, setCsvError] = useState("");
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number } | null>(null);

  async function load() {
    const res = await fetch(`/api/customers?search=${search}&page=${page}&limit=20`);
    const data = await res.json();
    setCustomers(data.customers ?? []);
    setTotal(data.total ?? 0);
  }

  useEffect(() => { load(); }, [search, page]);

  async function addCustomer(e: React.FormEvent) {
    e.preventDefault();
    setAddStatus("saving");
    setAddError("");
    const res = await fetch("/api/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setAddStatus("saved");
      setForm({ firstName: "", lastName: "", phone: "", email: "" });
      load();
      setTimeout(() => setAddStatus("idle"), 2000);
    } else {
      const d = await res.json();
      setAddError(d.error || "Failed to add customer");
      setAddStatus("error");
    }
  }

  function parseCSV(text: string) {
    setCsvError("");
    setImportResult(null);
    const lines = text.trim().split("\n").filter(Boolean);
    if (lines.length < 2) { setCsvError("CSV must have a header row and at least one data row."); return; }

    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/[^a-z]/g, ""));
    const phoneIdx = headers.findIndex((h) => h.includes("phone") || h.includes("mobile") || h.includes("number"));
    const firstIdx = headers.findIndex((h) => h.includes("first") || h === "firstname" || h === "name");
    const lastIdx = headers.findIndex((h) => h.includes("last") || h === "lastname" || h === "surname");
    const emailIdx = headers.findIndex((h) => h.includes("email"));

    if (phoneIdx === -1) { setCsvError("CSV must have a column named 'phone', 'mobile', or 'number'."); return; }

    const rows = lines.slice(1).map((line) => {
      const cols = line.split(",").map((c) => c.trim().replace(/^["']|["']$/g, ""));
      const phone = cols[phoneIdx]?.replace(/\s/g, "") || "";
      const firstName = firstIdx >= 0 ? cols[firstIdx] || "Unknown" : "Unknown";
      const lastName = lastIdx >= 0 ? cols[lastIdx] || phone : phone;
      const email = emailIdx >= 0 ? cols[emailIdx] || "" : "";
      return { firstName, lastName, phone, email };
    }).filter((r) => r.phone);

    if (!rows.length) { setCsvError("No valid rows found."); return; }
    setCsvRows(rows);
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => parseCSV(ev.target?.result as string);
    reader.readAsText(file);
  }

  function handlePaste(e: React.ChangeEvent<HTMLTextAreaElement>) {
    parseCSV(e.target.value);
  }

  async function importCSV() {
    if (!csvRows.length) return;
    setImporting(true);
    const res = await fetch("/api/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(csvRows),
    });
    const result = await res.json();
    setImportResult({ imported: result.imported ?? 0, skipped: result.skipped ?? 0 });
    setCsvRows([]);
    setImporting(false);
    load();
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} total customers</p>
        </div>
        <div className="flex gap-2">
          {(["list", "add", "import"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === t ? "bg-blue-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {t === "list" ? "👥 All Customers" : t === "add" ? "+ Add Customer" : "⬆ Import CSV"}
            </button>
          ))}
        </div>
      </div>

      {/* ── LIST ── */}
      {tab === "list" && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <input
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Search by name, phone or email..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-5 py-3 font-medium text-gray-500">Name</th>
                <th className="text-left px-5 py-3 font-medium text-gray-500">Phone</th>
                <th className="text-left px-5 py-3 font-medium text-gray-500">Email</th>
                <th className="text-left px-5 py-3 font-medium text-gray-500">SMS Status</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3 font-medium text-gray-900">{c.firstName} {c.lastName}</td>
                  <td className="px-5 py-3 text-gray-500 font-mono text-xs">{c.phone}</td>
                  <td className="px-5 py-3 text-gray-500">{c.email || "—"}</td>
                  <td className="px-5 py-3">
                    {c.smsOptOut ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded-full">🚫 Opted Out</span>
                    ) : c.smsOptIn ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">✓ Opted In</span>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <Link href={`/dashboard/customers/${c.id}`} className="text-blue-600 text-xs hover:underline font-medium">View →</Link>
                  </td>
                </tr>
              ))}
              {customers.length === 0 && (
                <tr><td colSpan={5} className="px-5 py-10 text-center text-gray-400">No customers found</td></tr>
              )}
            </tbody>
          </table>
          <div className="px-5 py-3 flex justify-between items-center border-t border-gray-100 bg-gray-50">
            <span className="text-sm text-gray-500">Showing {customers.length} of {total}</span>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm disabled:opacity-40 hover:bg-white transition-colors">← Prev</button>
              <button disabled={page * 20 >= total} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm disabled:opacity-40 hover:bg-white transition-colors">Next →</button>
            </div>
          </div>
        </div>
      )}

      {/* ── ADD ── */}
      {tab === "add" && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-lg">
          <h2 className="font-semibold text-gray-900 mb-4">Add Single Customer</h2>
          <form onSubmit={addCustomer} className="space-y-4">
            {addStatus === "error" && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-3 py-2 rounded-lg">{addError}</div>
            )}
            {addStatus === "saved" && (
              <div className="bg-green-50 border border-green-200 text-green-600 text-sm px-3 py-2 rounded-lg">✓ Customer added successfully</div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">First Name *</label>
                <input required className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} placeholder="John" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Last Name *</label>
                <input required className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} placeholder="Smith" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number *</label>
              <input required className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+16041234567" />
              <p className="text-xs text-gray-400 mt-1">Include country code e.g. +1 for US/Canada</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input type="email" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="john@example.com" />
            </div>
            <button type="submit" disabled={addStatus === "saving"} className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium text-sm hover:bg-blue-500 transition-colors disabled:opacity-50">
              {addStatus === "saving" ? "Adding..." : "Add Customer"}
            </button>
          </form>
        </div>
      )}

      {/* ── IMPORT CSV ── */}
      {tab === "import" && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-2xl space-y-5">
          <div>
            <h2 className="font-semibold text-gray-900">Import Customers via CSV</h2>
            <p className="text-sm text-gray-500 mt-1">Upload a CSV file or paste CSV data. Duplicates (same phone number) are automatically skipped.</p>
          </div>

          {/* Format guide */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Expected CSV Format</p>
            <code className="text-xs text-gray-700 block">first_name,last_name,phone,email</code>
            <code className="text-xs text-gray-500 block mt-1">John,Smith,+16041234567,john@example.com</code>
            <code className="text-xs text-gray-500 block">Mary,Lopez,+16049876543,</code>
            <p className="text-xs text-gray-400 mt-2">Required: <strong>phone</strong> column. Optional: first_name, last_name, email</p>
          </div>

          {/* File upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Upload CSV File</label>
            <div
              className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-blue-300 hover:bg-blue-50/30 transition-colors cursor-pointer"
              onClick={() => fileRef.current?.click()}
            >
              <div className="text-3xl mb-2">📄</div>
              <p className="text-sm font-medium text-gray-700">Click to upload CSV</p>
              <p className="text-xs text-gray-400 mt-1">or drag and drop</p>
              <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleFile} />
            </div>
          </div>

          {/* Or paste */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Or Paste CSV Data</label>
            <textarea
              rows={5}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder={"first_name,last_name,phone,email\nJohn,Smith,+16041234567,john@example.com\nMary,Lopez,+16049876543,"}
              onChange={handlePaste}
            />
          </div>

          {csvError && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg">{csvError}</div>
          )}

          {/* Preview */}
          {csvRows.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Preview — {csvRows.length} customers ready to import</p>
              <div className="border border-gray-200 rounded-lg overflow-hidden max-h-48 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left px-3 py-2 font-medium text-gray-500">First Name</th>
                      <th className="text-left px-3 py-2 font-medium text-gray-500">Last Name</th>
                      <th className="text-left px-3 py-2 font-medium text-gray-500">Phone</th>
                      <th className="text-left px-3 py-2 font-medium text-gray-500">Email</th>
                    </tr>
                  </thead>
                  <tbody>
                    {csvRows.slice(0, 50).map((r, i) => (
                      <tr key={i} className="border-b border-gray-50">
                        <td className="px-3 py-1.5">{r.firstName}</td>
                        <td className="px-3 py-1.5">{r.lastName}</td>
                        <td className="px-3 py-1.5 font-mono">{r.phone}</td>
                        <td className="px-3 py-1.5 text-gray-400">{r.email || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {csvRows.length > 50 && <p className="text-xs text-gray-400 px-3 py-2">...and {csvRows.length - 50} more</p>}
              </div>
              <button
                onClick={importCSV}
                disabled={importing}
                className="mt-3 w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium text-sm hover:bg-blue-500 transition-colors disabled:opacity-50"
              >
                {importing ? `Importing... (${csvRows.length} customers)` : `Import ${csvRows.length} Customers`}
              </button>
            </div>
          )}

          {importResult && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm font-semibold text-green-700">✓ Import complete</p>
              <p className="text-sm text-green-600 mt-1">{importResult.imported} imported · {importResult.skipped} skipped (duplicates)</p>
              <button onClick={() => { setImportResult(null); setTab("list"); }} className="mt-2 text-xs text-green-700 underline">View customers →</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
