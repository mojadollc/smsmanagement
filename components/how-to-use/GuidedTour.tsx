"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const tourSteps = [
  {
    title: "Welcome to SMS Dashboard! 👋",
    emoji: "🎉",
    desc: "This quick tour will walk you through everything you need to know to start sending SMS messages. It only takes 2 minutes.",
    action: null,
    tip: null,
  },
  {
    title: "Step 1 — Configure Twilio",
    emoji: "⚙️",
    desc: "Before anything else, you need to connect your Twilio account. Go to Settings and enter your Account SID, Auth Token, and Messaging Service SID.",
    action: { label: "Open Settings", href: "/dashboard/settings" },
    tip: "Find these in your Twilio Console at twilio.com/console",
  },
  {
    title: "Step 2 — Sync Phone Numbers",
    emoji: "📞",
    desc: "Once Twilio is connected, go to Phone Numbers and click 'Sync from Twilio'. Your numbers will appear automatically.",
    action: { label: "Open Phone Numbers", href: "/dashboard/phone-numbers" },
    tip: "You need at least one active phone number with SMS enabled.",
  },
  {
    title: "Step 3 — Add Customers",
    emoji: "👥",
    desc: "Add your contacts in the Customers section. You can add them one by one or bulk import via CSV file.",
    action: { label: "Open Customers", href: "/dashboard/customers" },
    tip: "CSV format: firstName, lastName, phone (with country code), email",
  },
  {
    title: "Step 4 — Create Groups (Optional)",
    emoji: "🗂️",
    desc: "Organize customers into Groups like 'VIP Clients' or 'New Leads'. Groups make it easy to target the right people in campaigns.",
    action: { label: "Open Groups", href: "/dashboard/groups" },
    tip: "You can skip this step and select individual customers in campaigns instead.",
  },
  {
    title: "Step 5 — Send Your First Message",
    emoji: "✉️",
    desc: "Go to Send SMS, pick a customer, type your message, and hit Send. Check the Inbox to watch the status update from queued → sent → delivered in real-time.",
    action: { label: "Send SMS Now", href: "/dashboard/messages" },
    tip: "No refresh needed — statuses update automatically every 2 seconds.",
  },
  {
    title: "Step 6 — Launch a Campaign",
    emoji: "📢",
    desc: "Ready to message many people at once? Create a Campaign, write your message, pick recipients, set a batch schedule, and click Schedule Campaign.",
    action: { label: "Open Campaigns", href: "/dashboard/campaigns" },
    tip: "Use batch scheduling to spread messages across the day and avoid carrier limits.",
  },
  {
    title: "Step 7 — Monitor the Inbox",
    emoji: "💬",
    desc: "When customers reply, their message appears in the Inbox at the top. You'll hear a notification sound and see the browser tab update with their phone number.",
    action: { label: "Open Inbox", href: "/dashboard/inbox" },
    tip: "Allow browser notifications for desktop pop-up alerts when you're on another tab.",
  },
  {
    title: "Step 8 — Check Reports",
    emoji: "📊",
    desc: "Use the Reports section to track your delivery rates, opt-outs, and campaign performance over time.",
    action: { label: "Open Reports", href: "/dashboard/reports" },
    tip: "High failure rates may indicate invalid phone numbers or carrier issues.",
  },
  {
    title: "You're all set! 🎊",
    emoji: "✅",
    desc: "You now know everything to run your SMS Dashboard like a pro. If you ever need a refresher, come back to this How to Use page anytime.",
    action: { label: "Go to Dashboard", href: "/dashboard" },
    tip: "Bookmark this page for quick reference.",
  },
];

export default function GuidedTour({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0);
  const router = useRouter();
  const current = tourSteps[step];
  const isLast = step === tourSteps.length - 1;
  const isFirst = step === 0;

  function handleAction() {
    if (current.action) {
      router.push(current.action.href);
      onClose();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 backdrop-blur-sm"
        style={{ background: "rgba(0,0,0,0.6)" }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
        style={{ background: "var(--bg-card)" }}
      >
        {/* Progress bar */}
        <div className="h-1" style={{ background: "var(--bg-subtle)" }}>
          <div
            className="h-full transition-all duration-500"
            style={{
              width: `${((step + 1) / tourSteps.length) * 100}%`,
              background: "linear-gradient(90deg, #3b82f6, #6366f1)",
            }}
          />
        </div>

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center transition-all hover:opacity-70"
          style={{ background: "var(--bg-subtle)", color: "var(--text-3)" }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-8">
          {/* Step counter */}
          <p className="text-xs font-semibold mb-4" style={{ color: "var(--text-3)" }}>
            {step + 1} of {tourSteps.length}
          </p>

          {/* Emoji */}
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-5"
            style={{ background: "linear-gradient(135deg, rgba(59,130,246,0.15), rgba(99,102,241,0.15))" }}
          >
            {current.emoji}
          </div>

          {/* Title */}
          <h2 className="text-xl font-bold mb-3" style={{ color: "var(--text)" }}>
            {current.title}
          </h2>

          {/* Description */}
          <p className="text-sm leading-relaxed mb-4" style={{ color: "var(--text-2)" }}>
            {current.desc}
          </p>

          {/* Tip */}
          {current.tip && (
            <div
              className="flex items-start gap-2 p-3 rounded-xl mb-6"
              style={{ background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.15)" }}
            >
              <span className="text-sm">💡</span>
              <p className="text-xs" style={{ color: "var(--accent)" }}>{current.tip}</p>
            </div>
          )}

          {/* Step dots */}
          <div className="flex items-center justify-center gap-1.5 mb-6">
            {tourSteps.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                className="rounded-full transition-all"
                style={{
                  width: i === step ? "20px" : "6px",
                  height: "6px",
                  background: i === step ? "#3b82f6" : "var(--border)",
                }}
              />
            ))}
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            {!isFirst && (
              <button
                onClick={() => setStep(step - 1)}
                className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all"
                style={{ background: "var(--bg-subtle)", color: "var(--text-2)" }}
              >
                ← Back
              </button>
            )}

            {current.action && (
              <button
                onClick={handleAction}
                className="flex-1 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #3b82f6, #6366f1)" }}
              >
                {current.action.label} ↗
              </button>
            )}

            {!isLast ? (
              <button
                onClick={() => setStep(step + 1)}
                className="flex-1 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
                style={{ background: isFirst ? "linear-gradient(135deg, #3b82f6, #6366f1)" : "var(--bg-subtle)", color: isFirst ? "white" : "var(--text-2)" }}
              >
                {isFirst ? "Let's Go →" : "Next →"}
              </button>
            ) : (
              <button
                onClick={onClose}
                className="flex-1 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)" }}
              >
                Finish ✓
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
