import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { BookOpen, ChevronRight, ArrowLeft, Loader2, FileText } from "lucide-react";
import { useApp } from "../context/AppContext.jsx";
import { getChapters, listArticles } from "../api/client.js";

const LAW_SOURCE = "Constitution of Kenya, 2010";

function truncate(text, max = 160) {
  return text.length > max ? text.slice(0, max).trim() + "…" : text;
}

export default function Constitution() {
  const navigate = useNavigate();
  const { t } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeChapter = searchParams.get("chapter");

  const [chapters, setChapters] = useState([]);
  const [loadingChapters, setLoadingChapters] = useState(true);
  const [chapterError, setChapterError] = useState(null);

  const [articles, setArticles] = useState([]);
  const [loadingArticles, setLoadingArticles] = useState(false);
  const [articleError, setArticleError] = useState(null);

  // Load the chapter list once, up front - needed both for the grid view and to show
  // the chapter's title when a specific chapter is selected.
  useEffect(() => {
    let cancelled = false;
    setLoadingChapters(true);
    setChapterError(null);
    getChapters({ lawSource: LAW_SOURCE })
      .then((data) => !cancelled && setChapters(data))
      .catch((err) => !cancelled && setChapterError(err.message))
      .finally(() => !cancelled && setLoadingChapters(false));
    return () => {
      cancelled = true;
    };
  }, []);

  // Load articles for the selected chapter whenever it changes.
  useEffect(() => {
    if (!activeChapter) {
      setArticles([]);
      return;
    }
    let cancelled = false;
    setLoadingArticles(true);
    setArticleError(null);
    listArticles({ chapter: activeChapter, lawSource: LAW_SOURCE })
      .then((data) => !cancelled && setArticles(data))
      .catch((err) => !cancelled && setArticleError(err.message))
      .finally(() => !cancelled && setLoadingArticles(false));
    return () => {
      cancelled = true;
    };
  }, [activeChapter]);

  const currentChapter = chapters.find((c) => String(c.chapterNumber) === String(activeChapter));

  return (
    <main className="max-w-4xl mx-auto p-4 sm:p-6">
      {!activeChapter ? (
        <>
          <div className="flex items-center gap-2 mb-1">
            <BookOpen className="w-5 h-5 text-emerald-700" />
            <h1 className="text-xl font-bold">{t("constitution.title")}</h1>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{t("constitution.subtitle")}</p>

          {loadingChapters ? (
            <div className="flex items-center gap-2 text-gray-400 text-sm py-12 justify-center">
              <Loader2 className="w-4 h-4 animate-spin" /> {t("home.loadingChapters")}
            </div>
          ) : chapterError ? (
            <p className="text-sm text-red-600 text-center py-12">{chapterError}</p>
          ) : chapters.length === 0 ? (
            <div className="text-sm text-gray-400 rounded-xl border border-dashed border-gray-200 dark:border-gray-800 p-6 text-center">
              {t("home.noChapters")}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {chapters.map((ch) => (
                <button
                  key={ch.chapterNumber}
                  onClick={() => setSearchParams({ chapter: String(ch.chapterNumber) })}
                  className="flex items-start gap-3 rounded-xl border border-gray-200 dark:border-gray-800 p-4 text-left hover:border-emerald-600 hover:shadow-sm transition"
                >
                  <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-900 flex items-center justify-center shrink-0 font-semibold text-emerald-700 dark:text-emerald-300">
                    {ch.chapterNumber}
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-sm">{ch.title}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {ch.articleCount} {t("home.articleCount")}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 ml-auto shrink-0 mt-2" />
                </button>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          <button
            onClick={() => setSearchParams({})}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-emerald-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4" /> {t("constitution.allChapters")}
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="w-11 h-11 rounded-lg bg-emerald-50 dark:bg-emerald-900 flex items-center justify-center shrink-0 font-bold text-emerald-700 dark:text-emerald-300">
              {activeChapter}
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight">
                {currentChapter?.title || `${t("nav.constitution")} ${activeChapter}`}
              </h1>
              {currentChapter && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {currentChapter.articleCount} {t("home.articleCount")}
                </p>
              )}
            </div>
          </div>

          {loadingArticles ? (
            <div className="flex items-center gap-2 text-gray-400 text-sm py-12 justify-center">
              <Loader2 className="w-4 h-4 animate-spin" /> {t("constitution.loadingArticles")}
            </div>
          ) : articleError ? (
            <p className="text-sm text-red-600 text-center py-12">{articleError}</p>
          ) : articles.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-12">{t("constitution.noArticles")}</p>
          ) : (
            <div className="flex flex-col gap-3">
              {articles.map((a) => (
                <button
                  key={a._id}
                  onClick={() => navigate(`/constitution/${a.chapterNumber}/${a.articleNumber}?lawSource=${encodeURIComponent(a.lawSource)}`)}
                  className="flex items-start gap-3 rounded-xl border border-gray-200 dark:border-gray-800 p-4 text-left hover:border-emerald-600 hover:shadow-sm transition"
                >
                  <FileText className="w-4 h-4 text-emerald-700 mt-0.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-sm">
                      {t("constitution.article")} {a.articleNumber} - {a.articleTitle}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                      {truncate(a.text)}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 shrink-0 mt-1" />
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </main>
  );
}