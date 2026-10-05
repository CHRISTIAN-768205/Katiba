import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FolderOpen, ChevronRight, ArrowLeft, Loader2, Scale, Gavel } from "lucide-react";
import { useApp } from "../context/AppContext.jsx";
import { getTags, listArticles } from "../api/client.js";
import { getArticlePath } from "../utils/articleLinks.js";

function titleCase(tag) {
  return tag.replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function Topics() {
  const navigate = useNavigate();
  const { t } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTag = searchParams.get("tag");

  const [tags, setTags] = useState([]);
  const [loadingTags, setLoadingTags] = useState(true);
  const [tagsError, setTagsError] = useState(null);

  const [results, setResults] = useState([]);
  const [loadingResults, setLoadingResults] = useState(false);
  const [resultsError, setResultsError] = useState(null);

  // Level 1: every distinct tag, across every law source, A-Z (backend already sorts alphabetically)
  useEffect(() => {
    let cancelled = false;
    setLoadingTags(true);
    setTagsError(null);
    getTags()
      .then((data) => !cancelled && setTags(data))
      .catch((err) => !cancelled && setTagsError(err.message))
      .finally(() => !cancelled && setLoadingTags(false));
    return () => {
      cancelled = true;
    };
  }, []);

  // Level 2: everything tagged with the selected topic - deliberately NOT filtered by lawSource,
  // so a topic like "arrest" surfaces the Constitution, Penal Code, and Criminal Procedure Code
  // entries together in one place.
  useEffect(() => {
    if (!activeTag) {
      setResults([]);
      return;
    }
    let cancelled = false;
    setLoadingResults(true);
    setResultsError(null);
    listArticles({ tag: activeTag })
      .then((data) => !cancelled && setResults(data))
      .catch((err) => !cancelled && setResultsError(err.message))
      .finally(() => !cancelled && setLoadingResults(false));
    return () => {
      cancelled = true;
    };
  }, [activeTag]);

  // ---- Level 1: A-Z tag grid ----
  if (!activeTag) {
    return (
      <main className="max-w-4xl mx-auto p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-1">
          <FolderOpen className="w-5 h-5 text-emerald-700" />
          <h1 className="text-xl font-bold">{t("topics.title")}</h1>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{t("topics.subtitle")}</p>

        {loadingTags ? (
          <div className="flex items-center gap-2 text-gray-400 text-sm py-12 justify-center">
            <Loader2 className="w-4 h-4 animate-spin" /> {t("topics.loading")}
          </div>
        ) : tagsError ? (
          <p className="text-sm text-red-600 text-center py-12">{tagsError}</p>
        ) : tags.length === 0 ? (
          <div className="text-sm text-gray-400 rounded-xl border border-dashed border-gray-200 dark:border-gray-800 p-6 text-center">
            {t("topics.none")}
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {tags.map((item) => (
              <button
                key={item.tag}
                onClick={() => setSearchParams({ tag: item.tag })}
                className="flex items-center gap-2 rounded-full border border-gray-200 dark:border-gray-800 px-4 py-2 text-sm hover:border-emerald-600 hover:bg-emerald-50/50 dark:hover:bg-emerald-950 transition"
              >
                <span className="font-medium">{titleCase(item.tag)}</span>
                <span className="text-xs text-gray-400">{item.articleCount}</span>
              </button>
            ))}
          </div>
        )}
      </main>
    );
  }

  // ---- Level 2: cross-law results for the selected topic ----
  return (
    <main className="max-w-4xl mx-auto p-4 sm:p-6">
      <button
        onClick={() => setSearchParams({})}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-emerald-700 mb-4"
      >
        <ArrowLeft className="w-4 h-4" /> {t("topics.allTopics")}
      </button>

      <h1 className="text-lg font-bold mb-1">{titleCase(activeTag)}</h1>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">{t("topics.acrossLaws")}</p>

      {loadingResults ? (
        <div className="flex items-center gap-2 text-gray-400 text-sm py-12 justify-center">
          <Loader2 className="w-4 h-4 animate-spin" /> {t("topics.loadingResults")}
        </div>
      ) : resultsError ? (
        <p className="text-sm text-red-600 text-center py-12">{resultsError}</p>
      ) : results.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-12">{t("topics.noResults")}</p>
      ) : (
        <div className="flex flex-col gap-3">
          {results.map((a) => {
            const isCaseLaw = a.lawSource === "Case Law of Kenya";
            const isConstitution = (a.lawSource || "").includes("Constitution");
            return (
              <button
                key={a._id}
                onClick={() => navigate(getArticlePath(a))}
                className="flex items-start gap-3 rounded-xl border border-gray-200 dark:border-gray-800 p-4 text-left hover:border-emerald-600 hover:shadow-sm transition"
              >
                {isCaseLaw ? (
                  <Gavel className="w-4 h-4 text-emerald-700 mt-0.5 shrink-0" />
                ) : (
                  <Scale className="w-4 h-4 text-emerald-700 mt-0.5 shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  <div className={`font-semibold text-sm ${isCaseLaw ? "italic" : ""}`}>
                    {isCaseLaw
                      ? a.articleTitle
                      : `${isConstitution ? t("constitution.article") : t("laws.section")} ${a.articleNumber} - ${a.articleTitle}`}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{a.text}</p>
                  <div className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-1.5">{a.lawSource}</div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 shrink-0 mt-1" />
              </button>
            );
          })}
        </div>
      )}
    </main>
  );
}