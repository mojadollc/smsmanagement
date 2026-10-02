"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: "▦", exact: true },
  { href: "/dashboard/inbox", label: "Inbox", icon: "💬" },
  { href: "/dashboard/customers", label: "Customers", icon: "👥" },
  { href: "/dashboard/campaigns", label: "Campaigns", icon: "📣" },
  { href: "/dashboard/messages", label: "Send SMS", icon: "✉️" },
  { href: "/dashboard/phone-numbers", label: "Phone Numbers", icon: "📱" },
  { href: "/dashboard/reports", label: "Reports", icon: "📈" },
];

const adminNav = [
  { href: "/dashboard/admin", label: "Admin Panel", icon: "🛡️" },
  { href: "/dashboard/settings", label: "Settings", icon: "⚙️" },
];

interface User { name?: string; email: string; role: string; }

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.ok ? r.json() : null).then(setUser);
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  function isActive(href: string, exact?: boolean) {
    return exact ? pathname === href : pathname.startsWith(href);
  }

  return (
    <aside className="w-60 min-h-screen bg-gray-950 border-r border-gray-800 flex flex-col">
      {/* Logo */}
      <div className="p-5 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-sm">💬</div>
          <div>
            <h1 className="text-sm font-bold text-white">SMS Dashboard</h1>
            <p className="text-xs text-gray-500">beegoo.app</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5">
        <p className="text-xs font-medium text-gray-600 uppercase tracking-wider px-3 py-2">Main</p>
        {nav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
              isActive(item.href, item.exact)
                ? "bg-blue-600 text-white"
                : "text-gray-400 hover:text-white hover:bg-gray-800"
            }`}
          >
            <span className="text-base">{item.icon}</span>
            {item.label}
          </Link>
        ))}

        {user?.role === "admin" && (
          <>
            <p className="text-xs font-medium text-gray-600 uppercase tracking-wider px-3 py-2 mt-4">Admin</p>
            {adminNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive(item.href)
                    ? "bg-blue-600 text-white"
                    : "text-gray-400 hover:text-white hover:bg-gray-800"
                }`}
              >
                <span className="text-base">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </>
        )}
      </nav>

      {/* User */}
      <div className="p-3 border-t border-gray-800">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center text-xs font-bold text-white">
            {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "?"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.name || "User"}</p>
            <p className="text-xs text-gray-500 truncate">{user?.role}</p>
          </div>
          <button onClick={logout} className="text-gray-500 hover:text-red-400 text-xs transition-colors" title="Sign out">
            ⏻
          </button>
        </div>
      </div>
    </aside>
  );
}
