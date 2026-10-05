import React, { useState, useRef, useEffect } from "react";
import { Bot, Send, Loader2, User, Scale } from "lucide-react";
import { useApp } from "../context/AppContext.jsx";
import { askQuestion } from "../api/client.js";

export default function Chat() {
  const { lang } = useApp();
  const [messages, setMessages] = useState([]); // {role: 'user'|'assistant', text, articles?, urgency?}
  const [input, setInput] = useState("");
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, asking]);

  async function handleSend() {
    const q = input.trim();
    if (!q) return;
    setInput("");
    setError(null);
    setMessages((prev) => [...prev, { role: "user", text: q }]);
    setAsking(true);
    try {
      const result = await askQuestion(q, lang);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: result.answer, articles: result.articles, urgency: result.urgency },
      ]);
    } catch (err) {
      setError(err?.response?.data?.error || "Couldn't reach Katiba AI. Check that the backend is running.");
    } finally {
      setAsking(false);
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-57px-45px)]">
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center gap-3">
            <div className="w-12 h-12 rounded-full bg-emerald-800 flex items-center justify-center">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <h1 className="font-semibold text-lg">Ask Katiba AI</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
              Ask a direct question, or describe what happened to you - in English or Kiswahili.
              E.g. "jana nilipigwa na wezi, nifanye nini?"
            </p>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto flex flex-col gap-4">
            {messages.map((m, i) =>
              m.role === "user" ? (
                <div key={i} className="flex justify-end gap-2">
                  <div className="bg-emerald-800 text-white rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-lg text-sm">
                    {m.text}
                  </div>
                  <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center shrink-0">
                    <User className="w-3.5 h-3.5 text-gray-500" />
                  </div>
                </div>
              ) : (
                <div key={i} className="flex gap-2">
                  <div className="w-7 h-7 rounded-full bg-emerald-800 flex items-center justify-center shrink-0">
                    <Bot className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    {m.urgency === "immediate" && (
                      <div className="mb-2 rounded-xl bg-red-50 border border-red-200 dark:bg-red-950/40 dark:border-red-900 px-4 py-2.5 text-sm text-red-800 dark:text-red-300">
                        This sounds urgent. If you're in danger right now, call <strong>999 / 112</strong>.
                      </div>
                    )}
                    <div className="rounded-2xl rounded-tl-sm border border-gray-200 dark:border-gray-800 px-4 py-3 text-sm whitespace-pre-wrap leading-relaxed">
                      {m.text}
                    </div>
                    {m.articles?.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {m.articles.map((a) => (
                          <span
                            key={`${a.lawSource}-${a.articleNumber}`}
                            className="flex items-center gap-1 text-[11px] rounded-full border border-gray-200 dark:border-gray-800 px-2.5 py-1 text-gray-500 dark:text-gray-400"
                          >
                            <Scale className="w-3 h-3" />
                            {(a.lawSource || "").includes("Constitution") ? "Art." : "Sec."} {a.articleNumber} - {a.lawSource}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )
            )}
            {asking && (
              <div className="flex gap-2">
                <div className="w-7 h-7 rounded-full bg-emerald-800 flex items-center justify-center shrink-0">
                  <Bot className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="rounded-2xl rounded-tl-sm border border-gray-200 dark:border-gray-800 px-4 py-3 text-sm text-gray-400 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Thinking...
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <div className="border-t border-gray-200 dark:border-gray-800 p-4">
        <div className="max-w-2xl mx-auto rounded-xl border border-gray-200 dark:border-gray-800 p-2 flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ask anything about the Constitution, laws, or your rights..."
            className="flex-1 outline-none bg-transparent text-sm placeholder:text-gray-400 px-2"
          />
          <button
            onClick={handleSend}
            disabled={asking || !input.trim()}
            className="flex items-center gap-1.5 rounded-full bg-emerald-800 text-white px-4 py-2 text-sm font-medium disabled:opacity-50"
          >
            {asking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
        {error && <p className="max-w-2xl mx-auto mt-2 text-sm text-red-600">{error}</p>}
      </div>
    </div>
  );
}