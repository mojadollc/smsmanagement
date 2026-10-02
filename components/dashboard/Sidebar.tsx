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
  const [showLogout, setShowLogout] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.ok ? r.json() : null).then(setUser);
  }, []);

  async function confirmLogout() {
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  function isActive(href: string, exact?: boolean) {
    return exact ? pathname === href : pathname.startsWith(href);
  }

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || "?";

  return (
    <>
      <aside className="w-60 min-h-screen bg-gray-950 border-r border-gray-800 flex flex-col">
        {/* Logo */}
        <div className="p-5 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <div>
              <h1 className="text-sm font-bold text-white">SMS Dashboard</h1>
              <p className="text-xs text-gray-600">beegoo.app</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 overflow-y-auto">
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider px-3 py-2">Main</p>
          <div className="space-y-0.5">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive(item.href, item.exact)
                    ? "bg-blue-600 text-white shadow-sm shadow-blue-600/30"
                    : "text-gray-400 hover:text-white hover:bg-gray-800/80"
                }`}
              >
                <span className="text-base w-5 text-center">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </div>

          {user?.role === "admin" && (
            <>
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider px-3 py-2 mt-5">Admin</p>
              <div className="space-y-0.5">
                {adminNav.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isActive(item.href)
                        ? "bg-blue-600 text-white shadow-sm shadow-blue-600/30"
                        : "text-gray-400 hover:text-white hover:bg-gray-800/80"
                    }`}
                  >
                    <span className="text-base w-5 text-center">{item.icon}</span>
                    {item.label}
                  </Link>
                ))}
              </div>
            </>
          )}
        </nav>

        {/* User profile */}
        <div className="p-3 border-t border-gray-800">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-800/60 transition-colors group">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name || user?.email || "User"}</p>
              <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
            </div>
            <button
              onClick={() => setShowLogout(true)}
              className="text-gray-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-red-400/10"
              title="Sign out"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* Logout confirmation modal */}
      {showLogout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => !loggingOut && setShowLogout(false)}
          />
          {/* Modal */}
          <div className="relative bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-center w-12 h-12 bg-red-500/10 rounded-full mx-auto mb-4">
              <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white text-center mb-1">Sign out</h3>
            <p className="text-sm text-gray-400 text-center mb-6">
              Are you sure you want to sign out of your account?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogout(false)}
                disabled={loggingOut}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-medium py-2.5 rounded-xl text-sm transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmLogout}
                disabled={loggingOut}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white font-medium py-2.5 rounded-xl text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loggingOut ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Signing out...
                  </>
                ) : "Sign Out"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
