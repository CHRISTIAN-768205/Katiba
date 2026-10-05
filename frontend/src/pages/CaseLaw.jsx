import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Gavel, ChevronRight, ArrowLeft, Loader2 } from "lucide-react";
import { useApp } from "../context/AppContext.jsx";
import { getChapters, listArticles } from "../api/client.js";
import { getArticlePath } from "../utils/articleLinks.js";

const LAW_SOURCE = "Case Law of Kenya";

export default function CaseLaw() {
  const navigate = useNavigate();
  const { t } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeCategory = searchParams.get("category");

  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [categoriesError, setCategoriesError] = useState(null);

  const [cases, setCases] = useState([]);
  const [loadingCases, setLoadingCases] = useState(false);
  const [casesError, setCasesError] = useState(null);

  // Level 1: legal categories (Constitutional Law, Employment and Labour Law, ...)
  useEffect(() => {
    let cancelled = false;
    setLoadingCategories(true);
    setCategoriesError(null);
    getChapters({ lawSource: LAW_SOURCE })
      .then((data) => !cancelled && setCategories(data))
      .catch((err) => !cancelled && setCategoriesError(err.message))
      .finally(() => !cancelled && setLoadingCategories(false));
    return () => {
      cancelled = true;
    };
  }, []);

  // Level 2: cases within the selected category
  useEffect(() => {
    if (!activeCategory) {
      setCases([]);
      return;
    }
    let cancelled = false;
    setLoadingCases(true);
    setCasesError(null);
    listArticles({ lawSource: LAW_SOURCE, chapter: activeCategory })
      .then((data) => !cancelled && setCases(data))
      .catch((err) => !cancelled && setCasesError(err.message))
      .finally(() => !cancelled && setLoadingCases(false));
    return () => {
      cancelled = true;
    };
  }, [activeCategory]);

  const currentCategory = categories.find((c) => String(c.chapterNumber) === String(activeCategory));

  // ---- Level 1: categories ----
  if (!activeCategory) {
    return (
      <main className="max-w-4xl mx-auto p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-1">
          <Gavel className="w-5 h-5 text-emerald-700" />
          <h1 className="text-xl font-bold">{t("caseLaw.title")}</h1>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{t("caseLaw.subtitle")}</p>

        {loadingCategories ? (
          <div className="flex items-center gap-2 text-gray-400 text-sm py-12 justify-center">
            <Loader2 className="w-4 h-4 animate-spin" /> {t("caseLaw.loading")}
          </div>
        ) : categoriesError ? (
          <p className="text-sm text-red-600 text-center py-12">{categoriesError}</p>
        ) : categories.length === 0 ? (
          <div className="text-sm text-gray-400 rounded-xl border border-dashed border-gray-200 dark:border-gray-800 p-6 text-center">
            {t("caseLaw.none")}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {categories.map((c) => (
              <button
                key={c.chapterNumber}
                onClick={() => setSearchParams({ category: String(c.chapterNumber) })}
                className="flex items-start gap-3 rounded-xl border border-gray-200 dark:border-gray-800 p-4 text-left hover:border-emerald-600 hover:shadow-sm transition"
              >
                <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-900 flex items-center justify-center shrink-0">
                  <Gavel className="w-5 h-5 text-emerald-700 dark:text-emerald-300" />
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-sm">{c.title}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {c.articleCount} {t("caseLaw.cases")}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 ml-auto shrink-0 mt-2" />
              </button>
            ))}
          </div>
        )}
      </main>
    );
  }

  // ---- Level 2: cases within the selected category ----
  return (
    <main className="max-w-4xl mx-auto p-4 sm:p-6">
      <button
        onClick={() => setSearchParams({})}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-emerald-700 mb-4"
      >
        <ArrowLeft className="w-4 h-4" /> {t("caseLaw.allCategories")}
      </button>

      <h1 className="text-lg font-bold mb-1">{currentCategory?.title || activeCategory}</h1>
      {currentCategory && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">
          {currentCategory.articleCount} {t("caseLaw.cases")}
        </p>
      )}

      {loadingCases ? (
        <div className="flex items-center gap-2 text-gray-400 text-sm py-12 justify-center">
          <Loader2 className="w-4 h-4 animate-spin" /> {t("caseLaw.loadingCases")}
        </div>
      ) : casesError ? (
        <p className="text-sm text-red-600 text-center py-12">{casesError}</p>
      ) : cases.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-12">{t("caseLaw.noCases")}</p>
      ) : (
        <div className="flex flex-col gap-3">
          {cases.map((c) => (
            <button
              key={c._id}
              onClick={() => navigate(getArticlePath(c))}
              className="flex items-start gap-3 rounded-xl border border-gray-200 dark:border-gray-800 p-4 text-left hover:border-emerald-600 hover:shadow-sm transition"
            >
              <Gavel className="w-4 h-4 text-emerald-700 mt-0.5 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-sm italic">{c.articleTitle}</div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{c.text}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 shrink-0 mt-1" />
            </button>
          ))}
        </div>
      )}
    </main>
  );
}