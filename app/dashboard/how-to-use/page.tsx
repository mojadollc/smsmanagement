"use client";

import { useState } from "react";
import GuidedTour from "@/components/how-to-use/GuidedTour";
import ProductTour from "@/components/how-to-use/ProductTour";
import OnboardingChecklist from "@/components/how-to-use/OnboardingChecklist";

const sections = [
  { id: "onboarding", label: "Getting Started", icon: "🚀" },
  { id: "tour", label: "Product Tour", icon: "🗺️" },
  { id: "guided", label: "Guided Tour", icon: "🎯" },
];

export default function HowToUsePage() {
  const [activeSection, setActiveSection] = useState("onboarding");
  const [showGuidedTour, setShowGuidedTour] = useState(false);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="rounded-2xl p-8 text-white" style={{ background: "linear-gradient(135deg, #3b82f6, #6366f1)" }}>
        <div className="flex items-center gap-4 mb-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ background: "rgba(255,255,255,0.2)" }}>
            📖
          </div>
          <div>
            <h1 className="text-2xl font-bold">How to Use SMS Dashboard</h1>
            <p className="text-blue-100 text-sm mt-0.5">Your complete guide to managing SMS campaigns & conversations</p>
          </div>
        </div>
        <button
          onClick={() => setShowGuidedTour(true)}
          className="mt-4 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:scale-105"
          style={{ background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.3)" }}
        >
          🎯 Start Guided Tour
        </button>
      </div>

      {/* Tab Nav */}
      <div className="flex gap-2 p-1 rounded-xl" style={{ background: "var(--bg-subtle)" }}>
        {sections.map((s) => (
          <button
            key={s.id}
            onClick={() => setActiveSection(s.id)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all"
            style={{
              background: activeSection === s.id ? "var(--bg-card)" : "transparent",
              color: activeSection === s.id ? "var(--text)" : "var(--text-3)",
              boxShadow: activeSection === s.id ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
            }}
          >
            <span>{s.icon}</span>
            <span>{s.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      {activeSection === "onboarding" && <OnboardingChecklist />}
      {activeSection === "tour" && <ProductTour />}
      {activeSection === "guided" && (
        <div className="rounded-2xl p-8 text-center" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <div className="text-5xl mb-4">🎯</div>
          <h2 className="text-xl font-bold mb-2" style={{ color: "var(--text)" }}>Interactive Guided Tour</h2>
          <p className="text-sm mb-6" style={{ color: "var(--text-2)" }}>
            A step-by-step walkthrough of every feature. Click Start and follow the prompts.
          </p>
          <button
            onClick={() => setShowGuidedTour(true)}
            className="px-8 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105"
            style={{ background: "linear-gradient(135deg, #3b82f6, #6366f1)" }}
          >
            Start Guided Tour →
          </button>
        </div>
      )}

      {/* Guided Tour Overlay */}
      {showGuidedTour && <GuidedTour onClose={() => setShowGuidedTour(false)} />}
    </div>
  );
}
