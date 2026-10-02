import CustomerList from "@/components/customers/CustomerList";

export default function CustomersPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
      <CustomerList />
    </div>
  );
}
