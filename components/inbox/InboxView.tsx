"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface Message {
  id: string;
  direction: "inbound" | "outbound";
  body: string;
  status: string;
  createdAt: string;
}

interface Conversation {
  id: string;
  customer: { firstName: string; lastName: string; phone: string };
  messages: Message[];
  unreadCount: number;
  lastMessageAt: string;
}

function formatTime(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const days = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (days === 0) return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  if (days === 1) return "Yesterday";
  if (days < 7) return date.toLocaleDateString("en-US", { weekday: "short" });
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getInitials(firstName: string, lastName: string) {
  return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
}

function getAvatarColor(phone: string) {
  const colors = [
    "from-blue-500 to-indigo-600", "from-purple-500 to-pink-600",
    "from-green-500 to-teal-600", "from-orange-500 to-red-600",
    "from-cyan-500 to-blue-600", "from-rose-500 to-purple-600",
  ];
  return colors[phone.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % colors.length];
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    delivered:   { bg: "rgba(34,197,94,0.15)",  color: "#16a34a" },
    sent:        { bg: "rgba(59,130,246,0.15)",  color: "#2563eb" },
    pending:     { bg: "rgba(234,179,8,0.15)",   color: "#ca8a04" },
    failed:      { bg: "rgba(239,68,68,0.15)",   color: "#dc2626" },
    undelivered: { bg: "rgba(239,68,68,0.15)",   color: "#dc2626" },
    queued:      { bg: "rgba(156,163,175,0.15)", color: "#6b7280" },
  };
  const s = map[status] || map.pending;
  return (
    <span className="text-xs px-1.5 py-0.5 rounded font-medium" style={{ background: s.bg, color: s.color }}>
      {status}
    </span>
  );
}

export default function InboxView() {
  // Stable ordered list — only reordered when a new message arrives, not on every poll
  const [convList, setConvList] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [roleLoaded, setRoleLoaded] = useState(false);

  // Refs — never cause re-renders
  const convListRef = useRef<Conversation[]>([]);
  const selectedIdRef = useRef<string | null>(null);
  const prevMsgCountRef = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isOpeningRef = useRef(false);

  // Keep refs in sync
  useEffect(() => { convListRef.current = convList; }, [convList]);
  useEffect(() => { selectedIdRef.current = selectedId; }, [selectedId]);

  function isNearBottom() {
    const el = scrollRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < 100;
  }

  function scrollToBottom(behavior: ScrollBehavior = "smooth") {
    messagesEndRef.current?.scrollIntoView({ behavior });
  }

  // ── Poll conversation list every 4s — only update unread counts & add new convos, never reorder ──
  const pollList = useCallback(async () => {
    try {
      const qs = showAll ? "?limit=50&all=true" : "?limit=50";
      const res = await fetch(`/api/conversations${qs}`);
      if (!res.ok) return;
      const data = await res.json();
      const fresh: Conversation[] = data.conversations ?? [];

      setConvList(prev => {
        const prevMap = new Map(prev.map(c => [c.id, c]));
        const freshMap = new Map(fresh.map(c => [c.id, c]));

        // Update existing entries in-place (preserve order, just update counts/lastMsg)
        const updated = prev.map(c => {
          const f = freshMap.get(c.id);
          if (!f) return c;
          // Only update if something actually changed
          if (f.unreadCount === c.unreadCount && f.lastMessageAt === c.lastMessageAt) return c;
          return { ...c, unreadCount: f.unreadCount, lastMessageAt: f.lastMessageAt, messages: f.messages };
        });

        // Append brand-new conversations at the top
        const newOnes = fresh.filter(c => !prevMap.has(c.id));
        if (newOnes.length > 0) return [...newOnes, ...updated];

        return updated;
      });
    } catch {}
  }, [showAll]);

  // ── Poll selected conversation messages every 3s ──
  const pollSelected = useCallback(async () => {
    const id = selectedIdRef.current;
    if (!id) return;
    try {
      const res = await fetch(`/api/conversations/${id}`);
      if (!res.ok) return;
      const data = await res.json();
      setSelectedConv(prev => {
        if (!prev) return data;
        const countChanged = data.messages?.length !== prev.messages?.length;
        const prevLast = prev.messages?.[prev.messages.length - 1];
        const newLast = data.messages?.[data.messages.length - 1];
        const statusChanged = prevLast?.id === newLast?.id && prevLast?.status !== newLast?.status;
        if (!countChanged && !statusChanged) return prev;
        // Only scroll if new message arrived and user is near bottom
        if (countChanged && data.messages.length > (prev.messages?.length ?? 0) && isNearBottom()) {
          setTimeout(() => scrollToBottom("smooth"), 30);
        }
        return data;
      });
    } catch {}
  }, []);

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then(d => {
      if (d.role === "admin") { setIsAdmin(true); setShowAll(true); }
      setCurrentUserId(d.id);
      setRoleLoaded(true);
    }).catch(() => { setRoleLoaded(true); });
  }, []);

  useEffect(() => {
    if (!roleLoaded) return;
    // Initial load
    const qs = showAll ? "?limit=50&all=true" : "?limit=50";
    fetch(`/api/conversations${qs}`)
      .then(r => r.json())
      .then(d => {
        const convos: Conversation[] = d.conversations ?? [];
        const sorted = [...convos].sort((a, b) =>
          new Date(b.lastMessageAt || 0).getTime() - new Date(a.lastMessageAt || 0).getTime()
        );
        setConvList(sorted);
      })
      .catch(() => {});

    const listInterval = setInterval(pollList, 4000);
    const msgInterval  = setInterval(pollSelected, 3000);
    return () => { clearInterval(listInterval); clearInterval(msgInterval); };
  }, [pollList, pollSelected, showAll, roleLoaded]);

  // ── Open a conversation — debounced to prevent double-click issues ──
  async function openConversation(conv: Conversation) {
    if (isOpeningRef.current || selectedIdRef.current === conv.id) return;
    isOpeningRef.current = true;
    setSelectedId(conv.id);
    prevMsgCountRef.current = 0;
    setSelectedConv(null); // clear immediately so old messages don't flash

    // Mark as read in list immediately
    setConvList(prev => prev.map(c => c.id === conv.id ? { ...c, unreadCount: 0 } : c));

    try {
      const res = await fetch(`/api/conversations/${conv.id}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedConv(data);
        // Scroll to bottom after DOM paints
        requestAnimationFrame(() => {
          requestAnimationFrame(() => scrollToBottom("instant"));
        });
      }
    } catch {}
    isOpeningRef.current = false;
  }

  async function sendReply() {
    if (!reply.trim() || !selectedConv || sending) return;
    setSending(true);
    const body = reply;
    setReply("");
    try {
      const res = await fetch(`/api/conversations/${selectedConv.id}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: body }),
      });
      if (res.ok) {
        const newMsg = await res.json();
        const now = new Date().toISOString();
        setSelectedConv(prev => prev ? { ...prev, messages: [...(prev.messages ?? []), newMsg], lastMessageAt: now } : prev);
        setConvList(prev => prev.map(c => c.id === selectedConv.id ? { ...c, lastMessageAt: now } : c));
        // Always scroll to bottom after sending
        requestAnimationFrame(() => {
          requestAnimationFrame(() => scrollToBottom("smooth"));
        });
      }
    } catch {}
    setSending(false);
  }

  const filtered = convList.filter(c =>
    `${c.customer.firstName} ${c.customer.lastName} ${c.customer.phone}`
      .toLowerCase().includes(search.toLowerCase())
  );
  const totalUnread = convList.reduce((acc, c) => acc + c.unreadCount, 0);

  return (
    <div className="flex h-[calc(100vh-8rem)] rounded-2xl overflow-hidden shadow-2xl" style={{ background: "var(--bg-card)" }}>

      {/* ── Conversation list ── */}
      <div className="w-80 flex flex-col border-r shrink-0" style={{ borderColor: "var(--border)", background: "var(--bg)" }}>
        <div className="p-4 border-b shrink-0" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold" style={{ color: "var(--text)" }}>Messages</h2>
            <div className="flex items-center gap-2">
              {totalUnread > 0 && (
                <span className="px-2.5 py-1 rounded-full text-xs font-bold text-white" style={{ background: "#dc2626" }}>
                  {totalUnread}
                </span>
              )}
              {isAdmin && (
                <span className="text-xs px-2.5 py-1 rounded-lg font-medium" style={{ background: "rgba(239,68,68,0.1)", color: "#dc2626" }}>
                  Monitor
                </span>
              )}
            </div>
          </div>
          <div className="relative">
            <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--text-3)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search conversations..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none"
              style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)", color: "var(--text)" }}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center">
              <p className="font-medium" style={{ color: "var(--text)" }}>No conversations</p>
              <p className="text-sm mt-1" style={{ color: "var(--text-3)" }}>Messages will appear here</p>
            </div>
          ) : (
            filtered.map(conv => {
              const active = selectedId === conv.id;
              return (
                <button
                  key={conv.id}
                  onClick={() => openConversation(conv)}
                  className="w-full text-left p-3 transition-colors"
                  style={{
                    background: active ? "var(--accent-soft)" : "transparent",
                    borderLeft: `3px solid ${active ? "var(--accent)" : "transparent"}`,
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className="relative shrink-0">
                      <div className={`w-11 h-11 rounded-full flex items-center justify-center text-white font-semibold text-sm bg-gradient-to-br ${getAvatarColor(conv.customer.phone)}`}>
                        {getInitials(conv.customer.firstName, conv.customer.lastName)}
                      </div>
                      {conv.unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: "#dc2626" }}>
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="font-semibold text-sm truncate" style={{ color: active ? "var(--accent-text)" : "var(--text)" }}>
                          {conv.customer.firstName} {conv.customer.lastName}
                        </span>
                        <span className="text-xs shrink-0 ml-2" style={{ color: "var(--text-3)" }}>
                          {conv.lastMessageAt ? formatTime(conv.lastMessageAt) : ""}
                        </span>
                      </div>
                      <p className="text-sm truncate" style={{ color: conv.unreadCount > 0 ? "var(--text)" : "var(--text-2)", fontWeight: conv.unreadCount > 0 ? 600 : 400 }}>
                        {conv.messages?.[0]?.direction === "inbound" ? "↩ " : ""}{conv.messages?.[0]?.body || "No messages yet"}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ── Chat area ── */}
      <div className="flex-1 flex flex-col min-w-0" style={{ background: "var(--bg-card)" }}>
        {selectedConv ? (
          <>
            {/* Header */}
            <div className="px-6 py-4 border-b shrink-0 flex items-center gap-4" style={{ borderColor: "var(--border)" }}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm shrink-0 bg-gradient-to-br ${getAvatarColor(selectedConv.customer.phone)}`}>
                {getInitials(selectedConv.customer.firstName, selectedConv.customer.lastName)}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold" style={{ color: "var(--text)" }}>
                  {selectedConv.customer.firstName} {selectedConv.customer.lastName}
                </h3>
                <p className="text-sm" style={{ color: "var(--text-3)" }}>{selectedConv.customer.phone}</p>
              </div>
            </div>

            {/* Messages */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto px-6 py-4 space-y-3"
              style={{ background: "var(--bg)" }}
            >
              {(selectedConv.messages ?? []).map((msg, idx) => {
                const out = msg.direction === "outbound";
                const msgs = selectedConv.messages ?? [];
                const showAvatar = idx === 0 || msgs[idx - 1]?.direction !== msg.direction;
                return (
                  <div key={msg.id} className={`flex items-end gap-2 ${out ? "justify-end" : "justify-start"}`}>
                    {!out && (
                      <div className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-white text-xs font-semibold bg-gradient-to-br ${getAvatarColor(selectedConv.customer.phone)} ${showAvatar ? "" : "invisible"}`}>
                        {getInitials(selectedConv.customer.firstName, selectedConv.customer.lastName)}
                      </div>
                    )}
                    <div className="max-w-sm">
                      <div
                        className={`px-4 py-2.5 ${out ? "rounded-2xl rounded-br-sm" : "rounded-2xl rounded-bl-sm"}`}
                        style={{
                          background: out ? "linear-gradient(135deg,#3b82f6,#6366f1)" : "var(--bg-card)",
                          boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
                        }}
                      >
                        <p className="text-sm leading-relaxed" style={{ color: out ? "white" : "var(--text)" }}>{msg.body}</p>
                      </div>
                      <div className={`flex items-center gap-1.5 mt-1 px-1 ${out ? "justify-end" : "justify-start"}`}>
                        <span className="text-xs" style={{ color: "var(--text-3)" }}>{formatTime(msg.createdAt)}</span>
                        {out && <StatusBadge status={msg.status} />}
                      </div>
                    </div>
                    {out && (
                      <div className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600 ${showAvatar ? "" : "invisible"}`}>
                        <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                    )}
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Reply box — hidden for admin (monitor only) */}
            {!isAdmin && (
              <div className="px-6 py-4 border-t shrink-0" style={{ borderColor: "var(--border)" }}>
                <div className="flex items-end gap-3 p-2 rounded-2xl" style={{ background: "var(--bg-subtle)" }}>
                  <textarea
                    value={reply}
                    onChange={e => setReply(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendReply(); } }}
                    placeholder="Type a message..."
                    rows={1}
                    className="flex-1 px-4 py-2.5 text-sm resize-none focus:outline-none"
                    style={{ background: "transparent", color: "var(--text)", maxHeight: "120px" }}
                  />
                  <button
                    onClick={sendReply}
                    disabled={sending || !reply.trim()}
                    className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-white transition-all disabled:opacity-50"
                    style={{ background: "linear-gradient(135deg,#3b82f6,#6366f1)" }}
                  >
                    {sending ? (
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            )}
            {isAdmin && (
              <div className="px-6 py-3 border-t shrink-0 text-center" style={{ borderColor: "var(--border)", background: "var(--bg-subtle)" }}>
                <p className="text-xs" style={{ color: "var(--text-3)" }}>👁 Monitor mode — replies are disabled for admin</p>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4" style={{ background: "var(--bg-subtle)" }}>
              <svg className="w-10 h-10" style={{ color: "var(--text-3)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-1" style={{ color: "var(--text)" }}>Select a conversation</h3>
            <p className="text-sm text-center" style={{ color: "var(--text-3)" }}>Choose from the list to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
}
