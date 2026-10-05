import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Scale, ChevronRight, ArrowLeft, Loader2, FileText, BookMarked } from "lucide-react";
import { useApp } from "../context/AppContext.jsx";
import { getLawSources, getChapters, listArticles } from "../api/client.js";
import { getArticlePath } from "../utils/articleLinks.js";

// Short, plain-language descriptions for the laws currently seeded. A law source not listed here
// (e.g. one you add later) still works fine - it just won't have a description line.
const LAW_DESCRIPTIONS = {
  "Penal Code (Cap 63)": { en: "Criminal offences - assault, theft, and more.", sw: "Makosa ya jinai - mashambulizi, wizi, na mengineyo." },
  "Criminal Procedure Code (Cap 75)": { en: "Arrest, bail, and the court process.", sw: "Kukamatwa, dhamana, na mchakato wa mahakama." },
  "Evidence Act (Cap 80)": { en: "Confessions, burden of proof, and court evidence rules.", sw: "Maungamo, mzigo wa uthibitisho, na kanuni za ushahidi mahakamani." },
  "Victim Protection Act No. 17 of 2014": { en: "Rights of victims of crime.", sw: "Haki za waathiriwa wa uhalifu." },
  "Employment Act No. 11 of 2007": { en: "Leave, termination, and workers' rights.", sw: "Likizo, kufukuzwa kazi, na haki za wafanyakazi." },
  "Companies Act No. 17 of 2015": { en: "Business registration and company directors.", sw: "Usajili wa biashara na wakurugenzi wa kampuni." },
  "Children Act No. 29 of 2022": { en: "Custody, parental responsibility, and children's rights.", sw: "Ulezi, jukumu la mzazi, na haki za watoto." },
  "Marriage Act No. 4 of 2014": { en: "Kinds of marriage and minimum age.", sw: "Aina za ndoa na umri wa chini." },
  "Land Registration Act No. 3 of 2012": { en: "Title deeds and land registration.", sw: "Hati miliki na usajili wa ardhi." },
  "Consumer Protection Act No. 46 of 2012": { en: "Consumer rights and unfair trade practices.", sw: "Haki za walaji na mazoea ya kibiashara yasiyo ya haki." },
  "Data Protection Act No. 24 of 2019": { en: "Privacy and data rights.", sw: "Faragha na haki za data." },
  "Procedure Guide": { en: "Practical how-to steps - not legislation itself.", sw: "Hatua za vitendo - sio sheria yenyewe." },
};

const EXCLUDED_FROM_LAWS_PAGE = ["Constitution of Kenya, 2010", "Case Law of Kenya"];

export default function Laws() {
  const navigate = useNavigate();
  const { lang, t } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeLaw = searchParams.get("law");
  const activeChapter = searchParams.get("chapter");

  const [lawSources, setLawSources] = useState([]);
  const [loadingLaws, setLoadingLaws] = useState(true);
  const [lawsError, setLawsError] = useState(null);

  const [chapters, setChapters] = useState([]);
  const [loadingChapters, setLoadingChapters] = useState(false);
  const [chaptersError, setChaptersError] = useState(null);

  const [articles, setArticles] = useState([]);
  const [loadingArticles, setLoadingArticles] = useState(false);
  const [articlesError, setArticlesError] = useState(null);

  // Level 1: list of laws (once, up front)
  useEffect(() => {
    let cancelled = false;
    setLoadingLaws(true);
    setLawsError(null);
    getLawSources()
      .then((data) => !cancelled && setLawSources(data.filter((s) => !EXCLUDED_FROM_LAWS_PAGE.includes(s.lawSource))))
      .catch((err) => !cancelled && setLawsError(err.message))
      .finally(() => !cancelled && setLoadingLaws(false));
    return () => {
      cancelled = true;
    };
  }, []);

  // Level 2: chapters for the selected law
  useEffect(() => {
    if (!activeLaw) {
      setChapters([]);
      return;
    }
    let cancelled = false;
    setLoadingChapters(true);
    setChaptersError(null);
    getChapters({ lawSource: activeLaw })
      .then((data) => !cancelled && setChapters(data))
      .catch((err) => !cancelled && setChaptersError(err.message))
      .finally(() => !cancelled && setLoadingChapters(false));
    return () => {
      cancelled = true;
    };
  }, [activeLaw]);

  // Level 3: articles/sections for the selected chapter
  useEffect(() => {
    if (!activeLaw || !activeChapter) {
      setArticles([]);
      return;
    }
    let cancelled = false;
    setLoadingArticles(true);
    setArticlesError(null);
    listArticles({ lawSource: activeLaw, chapter: activeChapter })
      .then((data) => !cancelled && setArticles(data))
      .catch((err) => !cancelled && setArticlesError(err.message))
      .finally(() => !cancelled && setLoadingArticles(false));
    return () => {
      cancelled = true;
    };
  }, [activeLaw, activeChapter]);

  const currentChapter = chapters.find((c) => String(c.chapterNumber) === String(activeChapter));

  function goToLaws() {
    setSearchParams({});
  }
  function goToChapters(lawSource) {
    setSearchParams({ law: lawSource });
  }
  function goToChapter(chapterNumber) {
    setSearchParams({ law: activeLaw, chapter: String(chapterNumber) });
  }

  // ---- Level 1: list of laws ----
  if (!activeLaw) {
    return (
      <main className="max-w-4xl mx-auto p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-1">
          <Scale className="w-5 h-5 text-emerald-700" />
          <h1 className="text-xl font-bold">{t("laws.title")}</h1>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{t("laws.subtitle")}</p>

        {loadingLaws ? (
          <div className="flex items-center gap-2 text-gray-400 text-sm py-12 justify-center">
            <Loader2 className="w-4 h-4 animate-spin" /> {t("laws.loading")}
          </div>
        ) : lawsError ? (
          <p className="text-sm text-red-600 text-center py-12">{lawsError}</p>
        ) : lawSources.length === 0 ? (
          <div className="text-sm text-gray-400 rounded-xl border border-dashed border-gray-200 dark:border-gray-800 p-6 text-center">
            {t("laws.none")}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {lawSources.map((s) => {
              const isGuide = s.lawSource === "Procedure Guide";
              const desc = LAW_DESCRIPTIONS[s.lawSource]?.[lang];
              return (
                <button
                  key={s.lawSource}
                  onClick={() => goToChapters(s.lawSource)}
                  className={`flex items-start gap-3 rounded-xl border p-4 text-left hover:shadow-sm transition ${
                    isGuide
                      ? "border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/30 hover:border-amber-400"
                      : "border-gray-200 dark:border-gray-800 hover:border-emerald-600"
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                      isGuide ? "bg-amber-100 dark:bg-amber-900" : "bg-emerald-50 dark:bg-emerald-900"
                    }`}
                  >
                    {isGuide ? (
                      <BookMarked className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    ) : (
                      <Scale className="w-5 h-5 text-emerald-700 dark:text-emerald-300" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-sm">{s.lawSource}</div>
                    {desc && <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{desc}</div>}
                    <div className="text-xs text-gray-400 mt-1">
                      {s.articleCount} {t("home.articleCount")}
                    </div>
                    {isGuide && (
                      <span className="inline-block mt-1.5 text-[10px] font-medium uppercase tracking-wide text-amber-700 dark:text-amber-400">
                        {t("laws.notLegislation")}
                      </span>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 ml-auto shrink-0 mt-2" />
                </button>
              );
            })}
          </div>
        )}
      </main>
    );
  }

  // ---- Level 2: chapters within the selected law ----
  if (activeLaw && !activeChapter) {
    return (
      <main className="max-w-4xl mx-auto p-4 sm:p-6">
        <button
          onClick={goToLaws}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-emerald-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> {t("laws.allLaws")}
        </button>

        <h1 className="text-lg font-bold mb-6">{activeLaw}</h1>

        {loadingChapters ? (
          <div className="flex items-center gap-2 text-gray-400 text-sm py-12 justify-center">
            <Loader2 className="w-4 h-4 animate-spin" /> {t("home.loadingChapters")}
          </div>
        ) : chaptersError ? (
          <p className="text-sm text-red-600 text-center py-12">{chaptersError}</p>
        ) : chapters.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-12">{t("home.noChapters")}</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {chapters.map((ch) => (
              <button
                key={ch.chapterNumber}
                onClick={() => goToChapter(ch.chapterNumber)}
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
      </main>
    );
  }

  // ---- Level 3: articles/sections within the selected chapter ----
  return (
    <main className="max-w-4xl mx-auto p-4 sm:p-6">
      <button
        onClick={() => goToChapters(activeLaw)}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-emerald-700 mb-4"
      >
        <ArrowLeft className="w-4 h-4" /> {activeLaw}
      </button>

      <h1 className="text-lg font-bold mb-1">{currentChapter?.title || `${t("nav.laws")} ${activeChapter}`}</h1>
      {currentChapter && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">
          {currentChapter.articleCount} {t("home.articleCount")}
        </p>
      )}

      {loadingArticles ? (
        <div className="flex items-center gap-2 text-gray-400 text-sm py-12 justify-center">
          <Loader2 className="w-4 h-4 animate-spin" /> {t("constitution.loadingArticles")}
        </div>
      ) : articlesError ? (
        <p className="text-sm text-red-600 text-center py-12">{articlesError}</p>
      ) : articles.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-12">{t("constitution.noArticles")}</p>
      ) : (
        <div className="flex flex-col gap-3">
          {articles.map((a) => (
            <button
              key={a._id}
              onClick={() => navigate(getArticlePath(a))}
              className="flex items-start gap-3 rounded-xl border border-gray-200 dark:border-gray-800 p-4 text-left hover:border-emerald-600 hover:shadow-sm transition"
            >
              <FileText className="w-4 h-4 text-emerald-700 mt-0.5 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-sm">
                  {t("laws.section")} {a.articleNumber} - {a.articleTitle}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{a.text}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 shrink-0 mt-1" />
            </button>
          ))}
        </div>
      )}
    </main>
  );
}