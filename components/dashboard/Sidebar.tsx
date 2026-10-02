"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/dashboard/inbox", label: "Inbox", icon: "💬" },
  { href: "/dashboard/customers", label: "Customers", icon: "👥" },
  { href: "/dashboard/campaigns", label: "Campaigns", icon: "📣" },
  { href: "/dashboard/phone-numbers", label: "Phone Numbers", icon: "📱" },
  { href: "/dashboard/messages", label: "Send SMS", icon: "✉️" },
  { href: "/dashboard/reports", label: "Reports", icon: "📈" },
  { href: "/dashboard/settings", label: "Settings", icon: "⚙️" },
];

export default function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="w-56 min-h-screen bg-gray-900 text-white flex flex-col">
      <div className="p-4 border-b border-gray-700">
        <h1 className="text-lg font-bold">SMS Dashboard</h1>
      </div>
      <nav className="flex-1 p-2">
        {nav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm mb-1 transition-colors ${
              pathname === item.href
                ? "bg-blue-600 text-white"
                : "text-gray-300 hover:bg-gray-700"
            }`}
          >
            <span>{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
