"use client";

import { useState, useEffect, useRef } from "react";

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
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (days === 0) {
    return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  } else if (days === 1) {
    return "Yesterday";
  } else if (days < 7) {
    return date.toLocaleDateString("en-US", { weekday: "short" });
  } else {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
}

function getInitials(firstName: string, lastName: string) {
  return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
}

function getRandomColor(phone: string) {
  const colors = [
    "from-blue-500 to-indigo-600",
    "from-purple-500 to-pink-600",
    "from-green-500 to-teal-600",
    "from-orange-500 to-red-600",
    "from-cyan-500 to-blue-600",
    "from-rose-500 to-purple-600",
  ];
  const index = phone.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
  return colors[index];
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; color: string; icon: React.ReactNode }> = {
    delivered: {
      bg: "rgba(34, 197, 94, 0.15)",
      color: "#16a34a",
      icon: (
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      ),
    },
    sent: {
      bg: "rgba(59, 130, 246, 0.15)",
      color: "#2563eb",
      icon: (
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
        </svg>
      ),
    },
    pending: {
      bg: "rgba(234, 179, 8, 0.15)",
      color: "#ca8a04",
      icon: (
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    failed: {
      bg: "rgba(239, 68, 68, 0.15)",
      color: "#dc2626",
      icon: (
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    queued: {
      bg: "rgba(156, 163, 175, 0.15)",
      color: "#6b7280",
      icon: (
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
    },
    undelivered: {
      bg: "rgba(239, 68, 68, 0.15)",
      color: "#dc2626",
      icon: (
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
        </svg>
      ),
    },
    read: {
      bg: "rgba(34, 197, 94, 0.15)",
      color: "#16a34a",
      icon: (
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
        </svg>
      ),
    },
  };

  const conf = config[status] || config.pending;

  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium"
      style={{ background: conf.bg, color: conf.color }}
    >
      {conf.icon}
      {status}
    </span>
  );
}

export default function InboxView() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  async function load(silent = false) {
    const res = await fetch("/api/conversations?limit=50");
    const data = await res.json();
    const convos = data.conversations ?? [];
    
    // Calculate total unread for notification
    const totalUnread = convos.reduce((acc: number, c: Conversation) => acc + c.unreadCount, 0);
    const prevTotal = conversations.reduce((acc, c) => acc + c.unreadCount, 0);
    
    if (!silent && totalUnread > prevTotal && prevTotal > 0) {
      setHasNewMessage(true);
      setTimeout(() => setHasNewMessage(false), 3000);
    }
    
    // Sort conversations by lastMessageAt (most recent first)
    const sorted = [...convos].sort((a, b) => {
      const dateA = new Date(a.lastMessageAt || a.customer?.phone).getTime();
      const dateB = new Date(b.lastMessageAt || b.customer?.phone).getTime();
      return dateB - dateA;
    });
    
    setConversations(sorted);
    
    // If selected conversation exists, update it with new messages
    if (selected) {
      const updatedSelected = sorted.find(c => c.id === selected.id);
      if (updatedSelected) {
        const res = await fetch(`/api/conversations/${selected.id}`);
        const fullData = await res.json();
        setSelected(fullData);
      }
    }
  }

  useEffect(() => { 
    load(); 
    // Poll every 3 seconds for new messages
    const interval = setInterval(() => load(true), 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selected?.messages?.length) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [selected?.messages]);

  async function openConversation(conv: Conversation) {
    const res = await fetch(`/api/conversations/${conv.id}`);
    const data = await res.json();
    setSelected(data);
    setConversations((prev) =>
      prev.map((c) => (c.id === conv.id ? { ...c, unreadCount: 0 } : c))
    );
    // Move conversation to top of list
    setConversations((prev) => {
      const filtered = prev.filter(c => c.id !== conv.id);
      return [{ ...conv, unreadCount: 0 }, ...filtered];
    });
  }

  async function sendReply() {
    if (!reply.trim() || !selected) return;
    setSending(true);
    
    const res = await fetch(`/api/conversations/${selected.id}/reply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: reply }),
    });
    
    if (res.ok) {
      const newMsg = await res.json();
      
      // Add message to current conversation
      setSelected((prev) =>
        prev ? { 
          ...prev, 
          messages: [...prev.messages, newMsg],
          lastMessageAt: new Date().toISOString()
        } : prev
      );
      
      // Update conversation in list (move to top)
      setConversations((prev) => {
        const filtered = prev.filter(c => c.id !== selected.id);
        const updated = {
          ...prev.find(c => c.id === selected.id)!,
          lastMessageAt: new Date().toISOString(),
          unreadCount: 0,
          messages: [newMsg]
        };
        return [updated, ...filtered];
      });
      
      setReply("");
    }
    setSending(false);
  }

  const filteredConversations = conversations.filter(c => 
    `${c.customer.firstName} ${c.customer.lastName} ${c.customer.phone}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  const totalUnread = conversations.reduce((acc, c) => acc + c.unreadCount, 0);

  return (
    <div 
      className="flex h-[calc(100vh-8rem)] rounded-2xl overflow-hidden shadow-2xl"
      style={{ background: "var(--bg-card)" }}
    >
      {/* Sidebar - Conversation List */}
      <div 
        className="w-80 flex flex-col border-r"
        style={{ borderColor: "var(--border)", background: "var(--bg)" }}
      >
        {/* Header */}
        <div className="p-4 border-b" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold" style={{ color: "var(--text)" }}>
              Messages
            </h2>
            <div className="flex items-center gap-2">
              {hasNewMessage && (
                <span 
                  className="px-2 py-1 rounded-full text-xs font-bold text-white animate-pulse"
                  style={{ background: "#dc2626" }}
                >
                  New!
                </span>
              )}
              {totalUnread > 0 && (
                <span 
                  className="px-2.5 py-1 rounded-full text-xs font-bold text-white"
                  style={{ background: "linear-gradient(135deg, #ef4444, #dc2626)" }}
                >
                  {totalUnread}
                </span>
              )}
            </div>
          </div>
          {/* Search */}
          <div className="relative">
            <svg 
              className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" 
              style={{ color: "var(--text-3)" }}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm transition-all focus:outline-none"
              style={{ 
                background: "var(--bg-subtle)", 
                border: "1px solid var(--border)",
                color: "var(--text)"
              }}
            />
          </div>
        </div>

        {/* Conversations */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center">
              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center mb-3"
                style={{ background: "var(--bg-subtle)" }}
              >
                <svg className="w-8 h-8" style={{ color: "var(--text-3)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="font-medium" style={{ color: "var(--text)" }}>No conversations</p>
              <p className="text-sm mt-1" style={{ color: "var(--text-3)" }}>Messages will appear here</p>
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const isActive = selected?.id === conv.id;
              const initials = getInitials(conv.customer.firstName, conv.customer.lastName);
              const colorClass = getRandomColor(conv.customer.phone);
              const lastMsg = conv.messages?.[0];
              
              return (
                <button
                  key={conv.id}
                  onClick={() => openConversation(conv)}
                  className="w-full text-left p-3 transition-all relative group"
                  style={{
                    background: isActive ? "var(--accent-soft)" : "transparent",
                    borderLeft: isActive ? "3px solid var(--accent)" : "3px solid transparent",
                  }}
                >
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className="relative">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-sm shrink-0 bg-gradient-to-br ${colorClass}`}>
                        {initials}
                      </div>
                      {conv.unreadCount > 0 && (
                        <span 
                          className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white"
                          style={{ background: "#dc2626" }}
                        >
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span 
                          className="font-semibold text-sm truncate"
                          style={{ color: isActive ? "var(--accent-text)" : "var(--text)" }}
                        >
                          {conv.customer.firstName} {conv.customer.lastName}
                        </span>
                        <span 
                          className="text-xs shrink-0 ml-2"
                          style={{ color: "var(--text-3)" }}
                        >
                          {conv.lastMessageAt ? formatTime(conv.lastMessageAt) : ""}
                        </span>
                      </div>
                      
                      <p 
                        className="text-sm truncate"
                        style={{ color: "var(--text-2)" }}
                      >
                        {lastMsg?.body || "No messages yet"}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col" style={{ background: "var(--bg-card)" }}>
        {selected ? (
          <>
            {/* Chat Header */}
            <div 
              className="px-6 py-4 border-b flex items-center gap-4"
              style={{ 
                borderColor: "var(--border)",
                background: "var(--bg-card)"
              }}
            >
              <div 
                className={`w-11 h-11 rounded-full flex items-center justify-center text-white font-semibold text-sm bg-gradient-to-br ${getRandomColor(selected.customer.phone)}`}
              >
                {getInitials(selected.customer.firstName, selected.customer.lastName)}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold" style={{ color: "var(--text)" }}>
                  {selected.customer.firstName} {selected.customer.lastName}
                </h3>
                <p className="text-sm flex items-center gap-1.5" style={{ color: "var(--text-3)" }}>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  {selected.customer.phone}
                </p>
              </div>
              
              {/* Status indicator */}
              <div 
                className="px-3 py-1.5 rounded-full text-xs font-medium"
                style={{ background: "rgba(34, 197, 94, 0.1)", color: "#16a34a" }}
              >
                Active
              </div>
            </div>

            {/* Messages */}
            <div 
              className="flex-1 overflow-y-auto px-6 py-4 space-y-4"
              style={{ background: "var(--bg)" }}
            >
              {selected.messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p style={{ color: "var(--text-3)" }}>No messages yet</p>
                </div>
              ) : (
                // Messages are already sorted by createdAt: "asc" from API (oldest first)
                selected.messages.map((msg, idx) => {
                  const isOutbound = msg.direction === "outbound";
                  const showAvatar = idx === 0 || selected.messages[idx - 1].direction !== msg.direction;
                  
                  return (
                    <div 
                      key={msg.id}
                      className={`flex items-end gap-2 ${isOutbound ? "justify-end" : "justify-start"}`}
                    >
                      {/* Avatar for inbound */}
                      {!isOutbound && showAvatar && (
                        <div 
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-xs bg-gradient-to-br ${getRandomColor(selected.customer.phone)} shrink-0`}
                        >
                          {getInitials(selected.customer.firstName, selected.customer.lastName)}
                        </div>
                      )}
                      {!isOutbound && !showAvatar && <div className="w-8" />}
                      
                      {/* Message bubble */}
                      <div className="max-w-md">
                        <div 
                          className={`px-4 py-2.5 ${
                            isOutbound 
                              ? "rounded-2xl rounded-br-md" 
                              : "rounded-2xl rounded-bl-md"
                          }`}
                          style={{
                            background: isOutbound 
                              ? "linear-gradient(135deg, #3b82f6, #6366f1)" 
                              : "var(--bg-card)",
                            boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
                          }}
                        >
                          <p 
                            className="text-sm leading-relaxed"
                            style={{ color: isOutbound ? "white" : "var(--text)" }}
                          >
                            {msg.body}
                          </p>
                        </div>
                        <div 
                          className="flex items-center gap-2 mt-1 px-1"
                          style={{ justifyContent: isOutbound ? "flex-end" : "flex-start" }}
                        >
                          <span 
                            className="text-xs"
                            style={{ color: "var(--text-3)" }}
                          >
                            {formatTime(msg.createdAt)}
                          </span>
                          {isOutbound && <StatusBadge status={msg.status} />}
                        </div>
                      </div>
                      
                      {/* Avatar for outbound */}
                      {isOutbound && showAvatar && (
                        <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg, #3b82f6, #6366f1)" }}>
                          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                      )}
                      {isOutbound && !showAvatar && <div className="w-8" />}
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Reply Input */}
            <div 
              className="px-6 py-4 border-t"
              style={{ borderColor: "var(--border)", background: "var(--bg-card)" }}
            >
              <div 
                className="flex items-end gap-3 p-2 rounded-2xl"
                style={{ background: "var(--bg-subtle)" }}
              >
                <textarea
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendReply();
                    }
                  }}
                  placeholder="Type a message..."
                  rows={1}
                  className="flex-1 px-4 py-2.5 text-sm resize-none focus:outline-none"
                  style={{ 
                    background: "transparent",
                    color: "var(--text)",
                    maxHeight: "120px"
                  }}
                />
                <button
                  onClick={sendReply}
                  disabled={sending || !reply.trim()}
                  className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: sending ? "var(--text-3)" : "linear-gradient(135deg, #3b82f6, #6366f1)" }}
                >
                  {sending ? (
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </>
        ) : (
          /* Empty State */
          <div className="flex-1 flex flex-col items-center justify-center p-8">
            <div 
              className="w-24 h-24 rounded-full flex items-center justify-center mb-6"
              style={{ background: "var(--bg-subtle)" }}
            >
              <svg className="w-12 h-12" style={{ color: "var(--text-3)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2" style={{ color: "var(--text)" }}>
              Select a conversation
            </h3>
            <p className="text-sm text-center max-w-sm" style={{ color: "var(--text-3)" }}>
              Choose a conversation from the sidebar to start messaging with your customers
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
