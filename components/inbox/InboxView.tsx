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

export default function InboxView() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/conversations")
      .then((r) => r.json())
      .then(setConversations);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selected?.messages]);

  async function openConversation(conv: Conversation) {
    const res = await fetch(`/api/conversations/${conv.id}`);
    const data = await res.json();
    setSelected(data);
    setConversations((prev) =>
      prev.map((c) => (c.id === conv.id ? { ...c, unreadCount: 0 } : c))
    );
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
      const msg = await res.json();
      setSelected((prev) =>
        prev ? { ...prev, messages: [...prev.messages, msg] } : prev
      );
      setReply("");
    }
    setSending(false);
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] border rounded-lg overflow-hidden">
      {/* Conversation list */}
      <div className="w-72 border-r overflow-y-auto bg-white">
        <div className="p-3 border-b font-semibold text-sm text-gray-600 uppercase tracking-wide">
          Conversations
        </div>
        {conversations.map((conv) => (
          <button
            key={conv.id}
            onClick={() => openConversation(conv)}
            className={`w-full text-left px-4 py-3 border-b hover:bg-gray-50 transition-colors ${
              selected?.id === conv.id ? "bg-blue-50" : ""
            }`}
          >
            <div className="flex justify-between items-center">
              <span className="font-medium text-sm">
                {conv.customer.firstName} {conv.customer.lastName}
              </span>
              {conv.unreadCount > 0 && (
                <span className="bg-blue-600 text-white text-xs rounded-full px-1.5 py-0.5">
                  {conv.unreadCount}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 truncate mt-0.5">
              {conv.messages?.[0]?.body ?? "No messages"}
            </p>
          </button>
        ))}
      </div>

      {/* Message thread */}
      <div className="flex-1 flex flex-col bg-gray-50">
        {selected ? (
          <>
            <div className="p-4 border-b bg-white">
              <p className="font-semibold">
                {selected.customer.firstName} {selected.customer.lastName}
              </p>
              <p className="text-sm text-gray-500">{selected.customer.phone}</p>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {selected.messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.direction === "outbound" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                      msg.direction === "outbound"
                        ? "bg-blue-600 text-white"
                        : "bg-white border text-gray-800"
                    }`}
                  >
                    <p>{msg.body}</p>
                    <p className={`text-xs mt-1 ${msg.direction === "outbound" ? "text-blue-200" : "text-gray-400"}`}>
                      {msg.status}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
            <div className="p-3 border-t bg-white flex gap-2">
              <input
                className="flex-1 border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Type your reply..."
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendReply()}
              />
              <button
                onClick={sendReply}
                disabled={sending || !reply.trim()}
                className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm disabled:opacity-50"
              >
                Send
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            Select a conversation
          </div>
        )}
      </div>
    </div>
  );
}
