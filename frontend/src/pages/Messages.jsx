import React, { useEffect, useState, useRef } from "react";
import { MessageSquare, Loader2, Send, ArrowLeft, Mail } from "lucide-react";
import { getThreads, getThread, sendMessage, markThreadRead } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";

function timeAgo(date) {
  const diffMs = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(date).toLocaleDateString();
}

export default function Messages() {
  const { user } = useAuth();
  const [threads, setThreads] = useState([]);
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [error, setError] = useState(null);

  const [activeThread, setActiveThread] = useState(null); // { otherPartyId, name, email }
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  function loadThreads() {
    setLoadingThreads(true);
    getThreads()
      .then(setThreads)
      .catch((err) => setError(err.message))
      .finally(() => setLoadingThreads(false));
  }

  useEffect(loadThreads, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function openThread(thread) {
    setActiveThread(thread);
    setLoadingMessages(true);
    try {
      const data = await getThread(thread.otherPartyId);
      setMessages(data);
      await markThreadRead(thread.otherPartyId);
      setThreads((prev) =>
        prev.map((t) => (t.otherPartyId === thread.otherPartyId ? { ...t, unreadCount: 0 } : t))
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingMessages(false);
    }
  }

  async function handleSend() {
    if (!input.trim() || !activeThread) return;
    setSending(true);
    try {
      const message = await sendMessage(activeThread.otherPartyId, input.trim());
      setMessages((prev) => [...prev, message]);
      setInput("");
      loadThreads(); // refresh previews/ordering in the sidebar
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="flex h-[calc(100vh-57px)]">
      {/* Thread list */}
      <div className={`w-full sm:w-72 shrink-0 border-r border-gray-200 dark:border-gray-800 ${activeThread ? "hidden sm:block" : ""}`}>
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <h1 className="font-bold flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-emerald-700" /> Messages
          </h1>
        </div>
        {loadingThreads ? (
          <div className="flex items-center gap-2 text-gray-400 text-sm py-8 justify-center">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading…
          </div>
        ) : threads.length === 0 ? (
          <p className="text-sm text-gray-400 text-center p-6">
            No conversations yet. Messaging opens up once you have an accepted consultation.
          </p>
        ) : (
          <div className="overflow-y-auto">
            {threads.map((t) => (
              <button
                key={t.otherPartyId}
                onClick={() => openThread(t)}
                className={`w-full text-left flex items-start gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 ${
                  activeThread?.otherPartyId === t.otherPartyId ? "bg-gray-50 dark:bg-gray-900" : ""
                }`}
              >
                <div className="w-9 h-9 rounded-full bg-emerald-800 text-white flex items-center justify-center text-xs font-semibold shrink-0">
                  {t.name?.[0]?.toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm truncate">{t.name}</span>
                    <span className="text-[11px] text-gray-400 shrink-0">{timeAgo(t.lastMessageAt)}</span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {t.lastSenderIsMe ? "You: " : ""}
                    {t.lastMessage}
                  </p>
                </div>
                {t.unreadCount > 0 && (
                  <span className="bg-emerald-800 text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center shrink-0">
                    {t.unreadCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Conversation */}
      <div className={`flex-1 flex flex-col min-w-0 ${!activeThread ? "hidden sm:flex" : ""}`}>
        {!activeThread ? (
          <div className="flex-1 flex items-center justify-center text-sm text-gray-400">
            Select a conversation
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 p-4 border-b border-gray-200 dark:border-gray-800">
              <button onClick={() => setActiveThread(null)} className="sm:hidden text-gray-400">
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div className="w-8 h-8 rounded-full bg-emerald-800 text-white flex items-center justify-center text-xs font-semibold">
                {activeThread.name?.[0]?.toUpperCase()}
              </div>
              <div>
                <div className="text-sm font-medium">{activeThread.name}</div>
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <Mail className="w-3 h-3" /> {activeThread.email}
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {loadingMessages ? (
                <div className="flex items-center gap-2 text-gray-400 text-sm py-8 justify-center">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading…
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {messages.map((m) => {
                    const isMe = m.senderId?._id === user?._id || m.senderId === user?._id;
                    return (
                      <div key={m._id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm ${
                            isMe
                              ? "bg-emerald-800 text-white rounded-tr-sm"
                              : "border border-gray-200 dark:border-gray-800 rounded-tl-sm"
                          }`}
                        >
                          {m.text}
                          <div className={`text-[10px] mt-1 ${isMe ? "text-emerald-200" : "text-gray-400"}`}>
                            {new Date(m.createdAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={bottomRef} />
                </div>
              )}
            </div>

            {error && <p className="text-sm text-red-600 px-4">{error}</p>}

            <div className="p-3 border-t border-gray-200 dark:border-gray-800 flex items-center gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Type a message..."
                className="flex-1 rounded-full border border-gray-200 dark:border-gray-800 bg-transparent px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-600"
              />
              <button
                onClick={handleSend}
                disabled={sending || !input.trim()}
                className="w-10 h-10 rounded-full bg-emerald-800 text-white flex items-center justify-center hover:bg-emerald-900 disabled:opacity-50 shrink-0"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}