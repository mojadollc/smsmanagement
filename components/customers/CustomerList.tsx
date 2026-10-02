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

  const [form, setForm] = useState({ firstName: "", lastName: "", phone: "", email: "" });
  const [addStatus, setAddStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [addError, setAddError] = useState("");

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
    <div className="space-y-5">
      {/* Tabs */}
      <div className="card p-2 flex gap-2" style={{ background: "var(--bg-card)" }}>
        {(["list", "add", "import"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all"
            style={{
              background: tab === t ? "var(--accent)" : "transparent",
              color: tab === t ? "white" : "var(--text-2)",
            }}
          >
            {t === "list" ? "All Customers" : t === "add" ? "+ Add Customer" : "Import CSV"}
          </button>
        ))}
      </div>

      {/* LIST */}
      {tab === "list" && (
        <div className="card overflow-hidden" style={{ background: "var(--bg-card)" }}>
          <div className="p-4 border-b" style={{ borderColor: "var(--border)" }}>
            <div className="relative">
              <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-3)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm"
                style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)", color: "var(--text)" }}
                placeholder="Search by name, phone or email..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: "var(--bg-subtle)" }}>
                  <th className="text-left px-5 py-3 font-medium" style={{ color: "var(--text-3)" }}>Name</th>
                  <th className="text-left px-5 py-3 font-medium" style={{ color: "var(--text-3)" }}>Phone</th>
                  <th className="text-left px-5 py-3 font-medium" style={{ color: "var(--text-3)" }}>Email</th>
                  <th className="text-left px-5 py-3 font-medium" style={{ color: "var(--text-3)" }}>SMS Status</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.id} className="border-b transition-colors hover:bg-[var(--bg-subtle)]" style={{ borderColor: "var(--border-soft)" }}>
                    <td className="px-5 py-3 font-medium" style={{ color: "var(--text)" }}>{c.firstName} {c.lastName}</td>
                    <td className="px-5 py-3 text-xs font-mono" style={{ color: "var(--text-2)" }}>{c.phone}</td>
                    <td className="px-5 py-3" style={{ color: "var(--text-2)" }}>{c.email || "—"}</td>
                    <td className="px-5 py-3">
                      {c.smsOptOut ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full" style={{ background: "rgba(239,68,68,0.1)", color: "#dc2626" }}>Opted Out</span>
                      ) : c.smsOptIn ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full" style={{ background: "rgba(34,197,94,0.1)", color: "#16a34a" }}>Opted In</span>
                      ) : (
                        <span className="text-xs" style={{ color: "var(--text-3)" }}>—</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <Link href={`/dashboard/customers/${c.id}`} className="text-xs font-medium hover:underline" style={{ color: "var(--accent)" }}>View</Link>
                    </td>
                  </tr>
                ))}
                {customers.length === 0 && (
                  <tr><td colSpan={5} className="px-5 py-12 text-center" style={{ color: "var(--text-3)" }}>No customers found</td></tr>
                )}
              </tbody>
            </table>
          </div>
          
          <div className="px-5 py-3 flex justify-between items-center border-t" style={{ borderColor: "var(--border)", background: "var(--bg-subtle)" }}>
            <span className="text-sm" style={{ color: "var(--text-2)" }}>{total} total customers</span>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all disabled:opacity-40" style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-2)" }}>Prev</button>
              <button disabled={page * 20 >= total} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all disabled:opacity-40" style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-2)" }}>Next</button>
            </div>
          </div>
        </div>
      )}

      {/* ADD */}
      {tab === "add" && (
        <div className="card p-6 max-w-xl" style={{ background: "var(--bg-card)" }}>
          <h2 className="font-semibold mb-4" style={{ color: "var(--text)" }}>Add New Customer</h2>
          <form onSubmit={addCustomer} className="space-y-4">
            {addStatus === "error" && <div className="px-4 py-3 rounded-lg text-sm" style={{ background: "rgba(239,68,68,0.1)", color: "#dc2626" }}>{addError}</div>}
            {addStatus === "saved" && <div className="px-4 py-3 rounded-lg text-sm" style={{ background: "rgba(34,197,94,0.1)", color: "#16a34a" }}>Customer added successfully!</div>}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-2)" }}>First Name *</label>
                <input required className="input" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} placeholder="John" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-2)" }}>Last Name *</label>
                <input required className="input" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} placeholder="Smith" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-2)" }}>Phone Number *</label>
              <input required className="input font-mono" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+16041234567" />
              <p className="text-xs mt-1" style={{ color: "var(--text-3)" }}>Include country code (e.g. +1 for US/Canada)</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-2)" }}>Email</label>
              <input type="email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="john@example.com" />
            </div>
            <button type="submit" disabled={addStatus === "saving"} className="btn-primary w-full py-2.5">
              {addStatus === "saving" ? "Adding..." : "Add Customer"}
            </button>
          </form>
        </div>
      )}

      {/* IMPORT CSV */}
      {tab === "import" && (
        <div className="card p-6 max-w-2xl space-y-5" style={{ background: "var(--bg-card)" }}>
          <div>
            <h2 className="font-semibold" style={{ color: "var(--text)" }}>Import Customers via CSV</h2>
            <p className="text-sm mt-1" style={{ color: "var(--text-2)" }}>Upload or paste CSV data. Duplicates are skipped.</p>
          </div>

          <div className="rounded-lg p-4" style={{ background: "var(--bg-subtle)" }}>
            <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "var(--text-3)" }}>Expected Format</p>
            <code className="text-xs block" style={{ color: "var(--text-2)" }}>first_name,last_name,phone,email</code>
            <code className="text-xs block mt-1" style={{ color: "var(--text-3)" }}>John,Smith,+16041234567,john@example.com</code>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-2)" }}>Upload CSV</label>
            <div
              className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all"
              style={{ borderColor: "var(--border)", background: "var(--bg-subtle)" }}
              onClick={() => fileRef.current?.click()}
            >
              <svg className="w-10 h-10 mx-auto mb-2" style={{ color: "var(--text-3)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-sm font-medium" style={{ color: "var(--text)" }}>Click to upload</p>
              <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleFile} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-2)" }}>Or paste CSV data</label>
            <textarea
              rows={4}
              className="input resize-none font-mono text-xs"
              placeholder="first_name,last_name,phone,email&#10;John,Smith,+16041234567,john@example.com"
              onChange={handlePaste}
            />
          </div>

          {csvError && <div className="px-4 py-3 rounded-lg text-sm" style={{ background: "rgba(239,68,68,0.1)", color: "#dc2626" }}>{csvError}</div>}

          {csvRows.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2" style={{ color: "var(--text)" }}>{csvRows.length} customers ready to import</p>
              <div className="border rounded-lg overflow-hidden max-h-48 overflow-y-auto" style={{ borderColor: "var(--border)" }}>
                <table className="w-full text-xs">
                  <thead style={{ background: "var(--bg-subtle)" }}>
                    <tr>
                      <th className="text-left px-3 py-2 font-medium" style={{ color: "var(--text-3)" }}>Name</th>
                      <th className="text-left px-3 py-2 font-medium" style={{ color: "var(--text-3)" }}>Phone</th>
                      <th className="text-left px-3 py-2 font-medium" style={{ color: "var(--text-3)" }}>Email</th>
                    </tr>
                  </thead>
                  <tbody>
                    {csvRows.slice(0, 50).map((r, i) => (
                      <tr key={i} className="border-b" style={{ borderColor: "var(--border-soft)" }}>
                        <td className="px-3 py-2" style={{ color: "var(--text)" }}>{r.firstName} {r.lastName}</td>
                        <td className="px-3 py-2 font-mono" style={{ color: "var(--text-2)" }}>{r.phone}</td>
                        <td className="px-3 py-2" style={{ color: "var(--text-3)" }}>{r.email || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button onClick={importCSV} disabled={importing} className="btn-primary w-full py-2.5 mt-3">
                {importing ? "Importing..." : `Import ${csvRows.length} Customers`}
              </button>
            </div>
          )}

          {importResult && (
            <div className="px-4 py-3 rounded-lg" style={{ background: "rgba(34,197,94,0.1)", color: "#16a34a" }}>
              <p className="text-sm font-semibold">Import complete!</p>
              <p className="text-sm mt-1">{importResult.imported} imported · {importResult.skipped} skipped</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
