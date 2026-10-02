"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ThemeToggle from "@/components/ui/ThemeToggle";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        router.push("/dashboard");
        router.refresh();
      } else {
        setError(data.error || "Login failed");
        setLoading(false);
      }
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Full-screen animated gradient background - Suno style */}
      <div className="absolute inset-0 gradient-bg-animated" />
      
      {/* Dark overlay for readability */}
      <div 
        className="absolute inset-0"
        style={{ background: "rgba(0, 0, 0, 0.4)" }}
      />

      {/* Animated glowing orbs */}
      <div 
        className="glow-orb orb-1 w-[500px] h-[500px]"
        style={{ top: "-15%", left: "-10%" }}
      />
      <div 
        className="glow-orb orb-2 w-[400px] h-[400px]"
        style={{ top: "50%", right: "-5%" }}
      />
      <div 
        className="glow-orb orb-3 w-[350px] h-[350px]"
        style={{ bottom: "5%", left: "15%" }}
      />

      {/* Additional floating blobs */}
      <div 
        className="absolute w-[300px] h-[300px] rounded-full blur-3xl opacity-50"
        style={{ 
          background: "linear-gradient(135deg, #fa709a, #fee140)",
          top: "25%",
          right: "20%",
          animation: "float 14s ease-in-out infinite"
        }}
      />
      <div 
        className="absolute w-[250px] h-[250px] rounded-full blur-3xl opacity-40"
        style={{ 
          background: "linear-gradient(135deg, #43e97b, #38f9d7)",
          bottom: "25%",
          left: "5%",
          animation: "float 16s ease-in-out infinite reverse"
        }}
      />
      <div 
        className="absolute w-[200px] h-[200px] rounded-full blur-3xl opacity-45"
        style={{ 
          background: "linear-gradient(135deg, #667eea, #764ba2)",
          top: "60%",
          left: "60%",
          animation: "float 12s ease-in-out infinite"
        }}
      />

      {/* Theme toggle top-right */}
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>

      <div 
        className={`relative w-full max-w-sm transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div 
            className="relative inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-5 shadow-2xl"
            style={{ 
              background: "linear-gradient(135deg, #667eea, #764ba2)",
              boxShadow: "0 25px 50px -12px rgba(102, 126, 234, 0.5)"
            }}
          >
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            <div 
              className="absolute inset-0 rounded-2xl opacity-50"
              style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.3) 0%, transparent 50%)" }}
            />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight mb-2 text-white drop-shadow-lg">
            SMS Dashboard
          </h1>
          <p className="text-base text-white/80">
            Sign in to manage text messages
          </p>
        </div>

        {/* Card */}
        <div 
          className="relative p-8 rounded-3xl shadow-2xl backdrop-blur-xl"
          style={{ 
            background: "rgba(255, 255, 255, 0.95)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
          }}
        >
          {/* Animated gradient line at top */}
          <div 
            className="absolute top-0 left-8 right-8 h-1 rounded-b-full gradient-bg-animated"
            style={{ backgroundSize: "200% 200%" }}
          />

          {error && (
            <div
              className="flex items-center gap-2.5 text-sm px-4 py-3 rounded-xl mb-5"
              style={{ 
                background: "rgba(239, 68, 68, 0.1)", 
                border: "1px solid rgba(239, 68, 68, 0.2)", 
                color: "#ef4444" 
              }}
            >
              <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={submit} className="space-y-5">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">
                  Email address
                </label>
                <div className="relative">
                  <svg 
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                  <input
                    type="email"
                    required
                    autoFocus
                    autoComplete="email"
                    className="w-full pl-12 pr-4 py-3.5 rounded-xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 border border-gray-200 text-gray-900"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">
                  Password
                </label>
                <div className="relative">
                  <svg 
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    className="w-full pl-12 pr-12 py-3.5 rounded-xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 border border-gray-200 text-gray-900"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-lg transition-colors text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading} 
              className="relative w-full flex items-center justify-center gap-2 py-4 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-60 overflow-hidden group"
              style={{ 
                background: "linear-gradient(135deg, #667eea, #764ba2)",
                boxShadow: "0 15px 35px -10px rgba(102, 126, 234, 0.5)"
              }}
            >
              <span 
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: "linear-gradient(135deg, #764ba2, #f093fb)" }}
              />
              {loading ? (
                <>
                  <svg className="w-5 h-5 animate-spin relative z-10" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span className="relative z-10">Signing in...</span>
                </>
              ) : (
                <>
                  <span className="relative z-10">Sign In</span>
                  <svg className="w-4 h-4 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 pt-5 border-t border-gray-200 text-center">
            <p className="text-xs text-gray-500">
              Build by:{" "}
              <span 
                className="font-bold"
                style={{ 
                  background: "linear-gradient(135deg, #667eea, #764ba2)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent"
                }}
              >
                Cyber-BlakSton
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
