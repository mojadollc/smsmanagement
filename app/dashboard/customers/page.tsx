import CustomerList from "@/components/customers/CustomerList";

export default function CustomersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>Customers</h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--text-2)" }}>Manage your customer database</p>
      </div>
      <CustomerList />
    </div>
  );
}
