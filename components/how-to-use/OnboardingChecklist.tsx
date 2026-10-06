"use client";

import { useState } from "react";
import Link from "next/link";

const steps = [
  {
    done: false,
    icon: "👥",
    title: "Add Your First Customer",
    desc: "Import contacts manually or via CSV bulk upload.",
    href: "/dashboard/customers",
    linkLabel: "Go to Customers",
    detail: [
      "Click Add Customer and fill in name and phone number",
      "Or click Import CSV to upload hundreds at once",
      "Make sure phone numbers include country code (e.g. +1 for US)",
      "Customers with SMS Opt-In enabled can receive messages",
    ],
  },
  {
    done: false,
    icon: "💬",
    title: "Send Your First SMS",
    desc: "Send a one-on-one message to a customer.",
    href: "/dashboard/messages",
    linkLabel: "Go to Send SMS",
    detail: [
      "Go to Send SMS in the sidebar",
      "Search for a customer by name or phone",
      "Type your message and click Send",
      "Check Inbox to see the delivery status update in real-time",
    ],
  },
  {
    done: false,
    icon: "💬",
    title: "Reply to Conversations",
    desc: "Manage two-way conversations in the Inbox.",
    href: "/dashboard/inbox",
    linkLabel: "Go to Inbox",
    detail: [
      "Inbox shows all conversations sorted by most recent",
      "Click a conversation to view full message history",
      "Type replies at the bottom and press Enter to send",
      "You'll hear a sound when new messages arrive",
    ],
  },
  {
    done: false,
    icon: "🗂️",
    title: "Create a Group (Optional)",
    desc: "Organize customers into Groups for targeted campaigns.",
    href: "/dashboard/groups",
    linkLabel: "Go to Groups",
    detail: [
      "Create groups like 'VIP Customers', 'New Leads', 'Inactive Users'",
      "Add customers to a group from the Customers page",
      "Select a group as recipients when creating a campaign",
    ],
  },
  {
    done: false,
    icon: "📢",
    title: "Launch a Campaign",
    desc: "Send bulk SMS to many customers with smart scheduling.",
    href: "/dashboard/campaigns",
    linkLabel: "Go to Campaigns",
    detail: [
      "Click New Campaign and give it a name",
      "Write your message (use {firstName} for personalization)",
      "Select recipients — individual customers or a Group",
      "Set a batch schedule (e.g. 50 messages at 9am, 50 at 11am)",
      "Click Schedule Campaign to activate",
      "Monitor progress from the Campaigns page",
    ],
  },
  {
    done: false,
    icon: "📊",
    title: "Monitor Your Reports",
    desc: "Track sent, delivered, and failed message counts.",
    href: "/dashboard/reports",
    linkLabel: "Go to Reports",
    detail: [
      "View total messages sent today vs. daily limit",
      "See delivered vs. failed breakdown per campaign",
      "Monitor active campaigns and queue status",
    ],
  },
];

export default function OnboardingChecklist() {
  const [checked, setChecked] = useState<boolean[]>(steps.map(() => false));
  const [expanded, setExpanded] = useState<number | null>(0);

  const toggle = (i: number) => {
    const next = [...checked];
    next[i] = !next[i];
    setChecked(next);
  };

  const completed = checked.filter(Boolean).length;

  return (
    <div className="space-y-4">
      {/* Progress */}
      <div className="rounded-2xl p-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>Setup Progress</span>
          <span className="text-sm font-bold" style={{ color: "var(--accent)" }}>{completed}/{steps.length} completed</span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--bg-subtle)" }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${(completed / steps.length) * 100}%`, background: "linear-gradient(90deg, #3b82f6, #6366f1)" }}
          />
        </div>
        {completed === steps.length && (
          <p className="text-sm font-medium mt-3 text-center" style={{ color: "#16a34a" }}>
            🎉 You're all set! You know how to use the SMS Dashboard.
          </p>
        )}
      </div>

      {/* Steps */}
      {steps.map((step, i) => (
        <div
          key={i}
          className="rounded-2xl overflow-hidden transition-all"
          style={{ background: "var(--bg-card)", border: `1px solid ${checked[i] ? "rgba(34,197,94,0.3)" : "var(--border)"}` }}
        >
          <div
            className="flex items-center gap-4 p-5 cursor-pointer"
            onClick={() => setExpanded(expanded === i ? null : i)}
          >
            <button
              onClick={(e) => { e.stopPropagation(); toggle(i); }}
              className="w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all"
              style={{
                borderColor: checked[i] ? "#22c55e" : "var(--border)",
                background: checked[i] ? "#22c55e" : "transparent",
              }}
            >
              {checked[i] && (
                <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>

            <span className="text-2xl">{step.icon}</span>

            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm" style={{ color: checked[i] ? "var(--text-3)" : "var(--text)", textDecoration: checked[i] ? "line-through" : "none" }}>
                Step {i + 1}: {step.title}
              </p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>{step.desc}</p>
            </div>

            <svg
              className="w-4 h-4 shrink-0 transition-transform"
              style={{ color: "var(--text-3)", transform: expanded === i ? "rotate(180deg)" : "rotate(0deg)" }}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>

          {expanded === i && (
            <div className="px-5 pb-5 pt-0">
              <div className="rounded-xl p-4 space-y-2" style={{ background: "var(--bg-subtle)" }}>
                {step.detail.map((d, j) => (
                  <div key={j} className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 mt-0.5" style={{ background: "linear-gradient(135deg, #3b82f6, #6366f1)" }}>
                      {j + 1}
                    </span>
                    <p className="text-sm" style={{ color: "var(--text-2)" }}>{d}</p>
                  </div>
                ))}
              </div>
              <Link
                href={step.href}
                className="inline-flex items-center gap-2 mt-3 px-4 py-2 rounded-lg text-sm font-medium text-white transition-all hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #3b82f6, #6366f1)" }}
              >
                {step.linkLabel}
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
