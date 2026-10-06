"use client";

import Link from "next/link";

const features = [
  {
    icon: "🏠",
    title: "Dashboard",
    href: "/dashboard",
    color: "#3b82f6",
    desc: "Your command center. See total messages sent today, active campaigns, delivery rates, and recent activity at a glance.",
    tips: [
      "The stats cards update every 30 seconds automatically",
      "Click any stat card to navigate to the related section",
      "Daily limit bar shows how many messages you have left today",
    ],
  },
  {
    icon: "💬",
    title: "Inbox",
    href: "/dashboard/inbox",
    color: "#8b5cf6",
    desc: "Two-way SMS conversations. See all inbound and outbound messages, reply in real-time, and get notified of new messages.",
    tips: [
      "New messages bubble to the top automatically — no refresh needed",
      "A sound plays and your browser tab updates when a new message arrives",
      "Message status updates live: queued → sent → delivered",
      "Allow browser notifications for desktop alerts",
    ],
  },
  {
    icon: "👥",
    title: "Customers",
    href: "/dashboard/customers",
    color: "#10b981",
    desc: "Manage your contact list. Add customers one by one or import hundreds via CSV upload.",
    tips: [
      "CSV format: firstName, lastName, phone, email (header row required)",
      "Phone numbers must include country code e.g. +1 for US",
      "Customers with SMS Opt-Out will be skipped automatically",
      "Search by name, phone, or email in real-time",
    ],
  },
  {
    icon: "🗂️",
    title: "Groups",
    href: "/dashboard/groups",
    color: "#f59e0b",
    desc: "Organize customers into groups for targeted campaigns. Create a group once and reuse it across multiple campaigns.",
    tips: [
      "Create groups like 'VIP Customers', 'New Leads', 'Inactive Users'",
      "Add or remove members at any time",
      "Select a group as campaign recipients to message everyone at once",
    ],
  },
  {
    icon: "📢",
    title: "Campaigns",
    href: "/dashboard/campaigns",
    color: "#ef4444",
    desc: "Send bulk SMS to hundreds of customers with smart batch scheduling to stay within carrier limits.",
    tips: [
      "Use {firstName} in your message for personalization",
      "Set a batch schedule to spread messages throughout the day",
      "Pause or cancel a running campaign at any time",
      "Track sent, delivered, and failed counts per campaign",
    ],
  },
  {
    icon: "✉️",
    title: "Send SMS",
    href: "/dashboard/messages",
    color: "#06b6d4",
    desc: "Send a one-off message to any customer instantly. Great for quick follow-ups or individual outreach.",
    tips: [
      "Search for a customer by name or phone number",
      "Message is sent immediately via your Twilio Messaging Service",
      "The conversation appears in Inbox after sending",
    ],
  },
  {
    icon: "📞",
    title: "Phone Numbers",
    href: "/dashboard/phone-numbers",
    color: "#6366f1",
    desc: "View all Twilio phone numbers linked to your account. Sync them directly from Twilio with one click.",
    tips: [
      "Click Sync from Twilio to pull in your latest numbers",
      "Each number shows SMS and MMS capability status",
      "Numbers are used automatically by your Messaging Service",
    ],
  },
  {
    icon: "📊",
    title: "Reports",
    href: "/dashboard/reports",
    color: "#84cc16",
    desc: "Analytics and delivery stats. Monitor your messaging performance over time.",
    tips: [
      "See total messages sent, delivered, and failed",
      "Track opt-out rates to monitor list health",
      "Use data to optimize your send times and message content",
    ],
  },
];

export default function ProductTour() {
  return (
    <div className="space-y-4">
      <p className="text-sm" style={{ color: "var(--text-2)" }}>
        A complete overview of every section in the dashboard. Click any card to navigate there directly.
      </p>

      <div className="grid gap-4">
        {features.map((f) => (
          <div
            key={f.href}
            className="rounded-2xl p-5 transition-all"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
          >
            <div className="flex items-start gap-4">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0"
                style={{ background: `${f.color}20` }}
              >
                {f.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-3 mb-1">
                  <h3 className="font-semibold" style={{ color: "var(--text)" }}>{f.title}</h3>
                  <Link
                    href={f.href}
                    className="shrink-0 text-xs px-3 py-1 rounded-lg font-medium transition-all hover:opacity-80"
                    style={{ background: `${f.color}20`, color: f.color }}
                  >
                    Open →
                  </Link>
                </div>
                <p className="text-sm mb-3" style={{ color: "var(--text-2)" }}>{f.desc}</p>
                <div className="space-y-1.5">
                  {f.tips.map((tip, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="text-xs mt-0.5" style={{ color: f.color }}>💡</span>
                      <p className="text-xs" style={{ color: "var(--text-3)" }}>{tip}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
