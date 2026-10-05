import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Scale, ThumbsUp, ThumbsDown, ExternalLink, Bot, Send, Loader2 } from "lucide-react";
import { useApp } from "../context/AppContext.jsx";
import { askQuestion } from "../api/client.js";
import { getArticlePath } from "../utils/articleLinks.js";

export default function Answer() {
  const location = useLocation();
  const navigate = useNavigate();
  const { lang, t } = useApp();
  const [followUp, setFollowUp] = useState("");
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState(null);

  const state = location.state;

  if (!state) {
    return (
      <div className="flex flex-col items-center justify-center text-center gap-4 py-24 px-6">
        <p className="text-gray-500">{t("answer.noQuestion")}</p>
        <button
          onClick={() => navigate("/")}
          className="rounded-full bg-emerald-800 text-white px-5 py-2 text-sm font-medium"
        >
          {t("answer.goAsk")}
        </button>
      </div>
    );
  }

  const { question, answer, articles = [], urgency } = state;

  async function handleFollowUp() {
    if (!followUp.trim()) return;
    setAsking(true);
    setError(null);
    try {
      const result = await askQuestion(followUp, lang);
      navigate("/answer", { state: { question: followUp, ...result }, replace: true });
      setFollowUp("");
    } catch (err) {
      setError(err.message);
    } finally {
      setAsking(false);
    }
  }

  return (
    <main className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-6 p-4 sm:p-6">
      <div className="flex flex-col gap-4 min-w-0">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-emerald-700 w-fit"
        >
          <ArrowLeft className="w-4 h-4" /> {t("answer.back")}
        </button>

        {urgency === "immediate" && (
          <div className="rounded-xl bg-red-50 border border-red-200 dark:bg-red-950/40 dark:border-red-900 px-4 py-3 text-sm text-red-800 dark:text-red-300">
            {t("answer.urgent")} <strong>999 / 112</strong> {t("answer.urgent.suffix")}
          </div>
        )}

        <div className="flex justify-end">
          <div className="bg-emerald-800 text-white rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-lg text-sm">
            {question}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-5 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-emerald-800 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-sm">Katiba AI</span>
          </div>

          <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap text-sm leading-relaxed">
            {answer}
          </div>

          <div className="flex items-center gap-3 mt-5 pt-4 border-t border-gray-100 dark:border-gray-800">
            <span className="text-xs text-gray-400">{t("answer.helpful")}</span>
            <button className="text-gray-400 hover:text-emerald-700" aria-label="Helpful">
              <ThumbsUp className="w-4 h-4" />
            </button>
            <button className="text-gray-400 hover:text-red-600" aria-label="Not helpful">
              <ThumbsDown className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-3">
          <div className="flex items-center gap-2">
            <input
              value={followUp}
              onChange={(e) => setFollowUp(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleFollowUp()}
              placeholder={t("answer.followUp.placeholder")}
              disabled={asking}
              className="flex-1 outline-none bg-transparent text-sm placeholder:text-gray-400 disabled:opacity-60"
            />
            <button
              onClick={handleFollowUp}
              disabled={asking || !followUp.trim()}
              className="flex items-center gap-1.5 rounded-full bg-emerald-800 text-white px-4 py-2 text-sm font-medium disabled:opacity-50"
            >
              {asking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </div>
      </div>

      <aside className="flex flex-col gap-5">
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Scale className="w-4 h-4 text-emerald-700" />
            <span className="font-semibold text-sm">{t("answer.relevantArticles")}</span>
          </div>
          {articles.length === 0 ? (
            <p className="text-sm text-gray-400">{t("answer.relevantArticles.empty")}</p>
          ) : (
            <div className="flex flex-col gap-3">
              {articles.map((a) => (
                <button
                  key={`${a.lawSource}-${a.chapterNumber}-${a.articleNumber}`}
                  onClick={() => navigate(getArticlePath(a))}
                  className="text-left rounded-lg border border-gray-100 dark:border-gray-800 p-3 hover:border-emerald-600"
                >
                  <div className="font-semibold text-sm text-emerald-800 dark:text-emerald-400">
                    {(a.lawSource || "").includes("Constitution") ? "Article" : "Section"} {a.articleNumber}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{a.articleTitle}</div>
                  <div className="text-[11px] text-gray-400 mt-0.5">{a.lawSource}</div>
                </button>
              ))}
              <button
                onClick={() => navigate("/constitution")}
                className="flex items-center gap-1.5 text-sm font-medium text-emerald-700 dark:text-emerald-400"
              >
                {t("answer.viewInConstitution")} <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50 dark:bg-amber-950/40 dark:border-amber-900 p-4">
          <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">{t("answer.disclaimer")}</p>
        </div>
      </aside>
    </main>
  );
}