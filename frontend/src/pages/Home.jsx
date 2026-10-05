import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bot,
  Paperclip,
  Mic,
  Send,
  Shield,
  Scale,
  ChevronRight,
  Star,
  Search,
  BookOpen,
  Gavel,
  FolderOpen,
  HelpCircle,
  Clock,
  FileText,
  Loader2,
} from "lucide-react";
import { useApp } from "../context/AppContext.jsx";
import { askQuestion, getRecentQuestions, getPopularQuestions } from "../api/client.js";

const tryAsking = [
  { icon: Shield, text: "Jana nilipigwa na wezi, nifanye nini?" },
  { icon: Shield, text: "What are my rights when arrested?" },
  { icon: Scale, text: "What is the bill of rights?" },
  { icon: BookOpen, text: "How is Parliament structured?" },
];

export default function Home() {
  const navigate = useNavigate();
  const { lang, t } = useApp();
  const [query, setQuery] = useState("");
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState(null);

  const [recent, setRecent] = useState([]);
  const [popular, setPopular] = useState([]);
  const [loadingPanels, setLoadingPanels] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function loadPanels() {
      setLoadingPanels(true);
      const results = await Promise.allSettled([getRecentQuestions(5), getPopularQuestions(5)]);
      if (cancelled) return;
      if (results[0].status === "fulfilled") setRecent(results[0].value);
      if (results[1].status === "fulfilled") setPopular(results[1].value);
      setLoadingPanels(false);
    }
    loadPanels();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleAsk(question) {
    const q = (question ?? query).trim();
    if (!q) return;
    setAsking(true);
    setError(null);
    try {
      const result = await askQuestion(q, lang);
      navigate("/answer", { state: { question: q, ...result } });
    } catch (err) {
      setError(err.message || t("home.error.default"));
    } finally {
      setAsking(false);
    }
  }

  return (
    <main className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6 p-4 sm:p-6">
      <div className="flex flex-col gap-6 min-w-0">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-50 to-emerald-50 dark:from-emerald-950 dark:to-emerald-900 px-6 py-7 sm:px-8 sm:py-8">
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">{t("home.welcome")}</h1>
          <p className="mt-1 text-gray-600 dark:text-emerald-200 max-w-md">{t("home.subtitle")}</p>
          <Scale className="hidden sm:block absolute right-8 bottom-2 w-24 h-24 text-emerald-700/70" strokeWidth={1.2} />
        </div>

        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-5 sm:p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-emerald-800 flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-semibold">{t("home.ask.title")}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">{t("home.ask.subtitle")}</div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-3">
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              rows={2}
              placeholder={t("home.ask.placeholder")}
              className="w-full resize-none outline-none bg-transparent text-sm placeholder:text-gray-400"
            />
            <div className="flex items-center justify-between mt-2">
              <button className="w-9 h-9 rounded-full border border-gray-200 dark:border-gray-800 flex items-center justify-center text-gray-500">
                <Paperclip className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-2">
                <button className="flex items-center gap-1.5 rounded-full border border-gray-200 dark:border-gray-800 px-4 py-2 text-sm font-medium">
                  <Mic className="w-4 h-4" /> {t("home.ask.speak")}
                </button>
                <button
                  onClick={() => handleAsk()}
                  disabled={asking || !query.trim()}
                  className="flex items-center gap-1.5 rounded-full bg-emerald-800 text-white px-4 py-2 text-sm font-medium hover:bg-emerald-900 disabled:opacity-50"
                >
                  {asking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {asking ? t("home.ask.thinking") : t("home.ask.button")}
                </button>
              </div>
            </div>
          </div>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

          <div className="mt-4">
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">{t("home.tryAsking")}</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {tryAsking.map((item) => (
                <button
                  key={item.text}
                  onClick={() => handleAsk(item.text)}
                  disabled={asking}
                  className="flex items-center gap-2.5 rounded-xl border border-gray-200 dark:border-gray-800 px-3.5 py-2.5 text-sm text-left hover:border-emerald-600 hover:bg-emerald-50/50 dark:hover:bg-emerald-950 disabled:opacity-50"
                >
                  <item.icon className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>{item.text}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-5">
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
            <span className="font-semibold text-sm">{t("home.quickAccess")}</span>
          </div>
          <div className="flex flex-col divide-y divide-gray-100 dark:divide-gray-800">
            {[
              { icon: Search, labelKey: "home.quickAccess.search", to: "/constitution" },
              { icon: BookOpen, labelKey: "home.quickAccess.laws", to: "/laws" },
              { icon: Gavel, labelKey: "home.quickAccess.judgments", to: "/case-law" },
              { icon: FolderOpen, labelKey: "home.quickAccess.topics", to: "/topics" },
              { icon: HelpCircle, labelKey: "home.quickAccess.faq", to: "/faq" },
            ].map((item) => (
              <button
                key={item.labelKey}
                onClick={() => navigate(item.to)}
                className="flex items-center justify-between py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:text-emerald-700"
              >
                <span className="flex items-center gap-2.5">
                  <item.icon className="w-4 h-4 text-gray-400" />
                  {t(item.labelKey)}
                </span>
                <ChevronRight className="w-4 h-4 text-gray-300" />
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
          <div className="flex items-center gap-2 mb-3">
            <HelpCircle className="w-4 h-4 text-emerald-700" />
            <span className="font-semibold text-sm">{t("home.popularQuestions")}</span>
          </div>
          {loadingPanels ? (
            <div className="text-sm text-gray-400 flex items-center gap-2 py-2">
              <Loader2 className="w-4 h-4 animate-spin" /> {t("home.loading")}
            </div>
          ) : popular.length === 0 ? (
            <p className="text-sm text-gray-400">{t("home.popularQuestions.empty")}</p>
          ) : (
            <div className="flex flex-col divide-y divide-gray-100 dark:divide-gray-800">
              {popular.map((p) => (
                <button
                  key={p.question}
                  onClick={() => handleAsk(p.question)}
                  className="flex items-center justify-between py-2.5 text-sm text-left text-gray-700 dark:text-gray-200 hover:text-emerald-700"
                >
                  <span>{p.question}</span>
                  <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-gray-500" />
            <span className="font-semibold text-sm">{t("home.recentlyViewed")}</span>
          </div>
          {loadingPanels ? (
            <div className="text-sm text-gray-400 flex items-center gap-2 py-2">
              <Loader2 className="w-4 h-4 animate-spin" /> {t("home.loading")}
            </div>
          ) : recent.length === 0 ? (
            <p className="text-sm text-gray-400">{t("home.recentlyViewed.empty")}</p>
          ) : (
            <div className="flex flex-col divide-y divide-gray-100 dark:divide-gray-800">
              {recent.map((item) => (
                <button
                  key={item._id}
                  onClick={() => handleAsk(item.question)}
                  className="flex items-start gap-2.5 py-2.5 text-left"
                >
                  <FileText className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-medium truncate">{item.question}</span>
                    <span className="block text-xs text-gray-500 dark:text-gray-400">
                      {item.citedArticles?.[0]?.articleTitle || ""}
                    </span>
                  </span>
                  <span className="text-xs text-gray-400 shrink-0">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}