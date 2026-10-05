import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Scale,
  Gavel,
  Loader2,
  AlertCircle,
  ChevronDown,
  HelpCircle,
  Lightbulb,
  BookMarked,
  Link2,
  Gavel as GavelIcon,
  Languages,
} from "lucide-react";
import { useApp } from "../context/AppContext.jsx";
import { getArticle, askQuestion } from "../api/client.js";

function CollapsibleOfficialText({ text }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-4 rounded-xl border border-gray-200 dark:border-gray-800">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-300"
      >
        Read the official text
        <ChevronDown className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <p className="px-4 pb-4 text-sm leading-relaxed whitespace-pre-wrap text-gray-600 dark:text-gray-400 border-t border-gray-100 dark:border-gray-800 pt-3">
          {text}
        </p>
      )}
    </div>
  );
}

export default function ArticleDetail() {
  const { chapterNumber, articleNumber } = useParams();
  const [searchParams] = useSearchParams();
  const lawSource = searchParams.get("lawSource") || undefined;
  const navigate = useNavigate();
  const { lang, t } = useApp();

  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [askingQuestion, setAskingQuestion] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getArticle(chapterNumber, articleNumber, lawSource)
      .then((data) => !cancelled && setArticle(data))
      .catch(() => !cancelled && setError("Couldn't load that entry. It may not be seeded yet."))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [chapterNumber, articleNumber, lawSource]);

  async function handleCommonQuestion(question) {
    setAskingQuestion(question);
    try {
      const result = await askQuestion(question, lang);
      navigate("/answer", { state: { question, ...result } });
    } catch (err) {
      setError(err.message);
    } finally {
      setAskingQuestion(null);
    }
  }

  if (loading) {
    return (
      <main className="max-w-2xl mx-auto p-4 sm:p-6">
        <div className="flex items-center gap-2 text-gray-400 text-sm py-12 justify-center">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading…
        </div>
      </main>
    );
  }
  if (error) {
    return (
      <main className="max-w-2xl mx-auto p-4 sm:p-6">
        <div className="flex flex-col items-center gap-2 text-center py-12">
          <AlertCircle className="w-6 h-6 text-amber-500" />
          <p className="text-sm text-gray-500 dark:text-gray-400">{error}</p>
        </div>
      </main>
    );
  }

  const isCaseLaw = article.lawSource === "Case Law of Kenya";
  const isConstitution = (article.lawSource || "").includes("Constitution");
  // If the person is browsing in Kiswahili and a real translation exists, lead with that instead
  // of the English plain-language explanation - otherwise fall back gracefully.
  const leadExplanation = lang === "sw" && article.swahiliTranslation ? article.swahiliTranslation : article.plainLanguage;

  return (
    <main className="max-w-2xl mx-auto p-4 sm:p-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-emerald-700 mb-4"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <article className="rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
        <div className="flex items-center gap-2 mb-1">
          {isCaseLaw ? (
            <Gavel className="w-4 h-4 text-emerald-700" />
          ) : (
            <Scale className="w-4 h-4 text-emerald-700" />
          )}
          <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
            {isCaseLaw ? article.chapterTitle : article.lawSource}
          </span>
        </div>

        {isCaseLaw ? (
          <>
            <h1 className="text-xl font-bold mb-1 italic">{article.articleTitle}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              {article.chapterTitle} · Case Law of Kenya
            </p>
          </>
        ) : (
          <>
            <h1 className="text-xl font-bold mb-1">
              {isConstitution ? "Article" : "Section"} {article.articleNumber} - {article.articleTitle}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{article.chapterTitle}</p>
          </>
        )}

        {/* Plain-language explanation leads, when available - this is the whole point of the rich data */}
        {leadExplanation ? (
          <>
            <p className="text-sm leading-relaxed">{leadExplanation}</p>
            <CollapsibleOfficialText text={article.officialText || article.text} />
          </>
        ) : (
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{article.text}</p>
        )}

        {/* Common questions - genuinely interactive, routes through the real RAG pipeline */}
        {article.commonQuestions?.length > 0 && (
          <div className="mt-6">
            <h2 className="flex items-center gap-1.5 text-sm font-semibold mb-2">
              <HelpCircle className="w-4 h-4 text-emerald-700" /> People also ask
            </h2>
            <div className="flex flex-col gap-1.5">
              {article.commonQuestions.map((q) => (
                <button
                  key={q}
                  onClick={() => handleCommonQuestion(q)}
                  disabled={askingQuestion === q}
                  className="text-left text-sm rounded-lg border border-gray-200 dark:border-gray-800 px-3 py-2 hover:border-emerald-600 hover:bg-emerald-50/50 dark:hover:bg-emerald-950 disabled:opacity-50 flex items-center justify-between"
                >
                  {q}
                  {askingQuestion === q && <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0 ml-2" />}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Real-life examples */}
        {article.realLifeExamples?.length > 0 && (
          <div className="mt-6">
            <h2 className="flex items-center gap-1.5 text-sm font-semibold mb-2">
              <Lightbulb className="w-4 h-4 text-amber-500" /> In everyday terms
            </h2>
            <ul className="flex flex-col gap-1.5">
              {article.realLifeExamples.map((ex, i) => (
                <li key={i} className="text-sm text-gray-600 dark:text-gray-300 flex gap-2">
                  <span className="text-emerald-600 shrink-0">•</span> {ex}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Legal concepts glossary */}
        {article.legalConcepts?.length > 0 && (
          <div className="mt-6">
            <h2 className="flex items-center gap-1.5 text-sm font-semibold mb-2">
              <BookMarked className="w-4 h-4 text-emerald-700" /> Key terms
            </h2>
            <ul className="flex flex-col gap-1.5">
              {article.legalConcepts.map((c, i) => (
                <li key={i} className="text-xs text-gray-500 dark:text-gray-400">
                  {c}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Cross-references to related provisions */}
        {article.crossReferenceExplanations && Object.keys(article.crossReferenceExplanations).length > 0 && (
          <div className="mt-6">
            <h2 className="flex items-center gap-1.5 text-sm font-semibold mb-2">
              <Link2 className="w-4 h-4 text-emerald-700" /> Related provisions
            </h2>
            <ul className="flex flex-col gap-2">
              {Object.entries(article.crossReferenceExplanations).map(([ref, explanation]) => (
                <li key={ref} className="text-xs">
                  <span className="font-medium text-gray-700 dark:text-gray-300">{ref}:</span>{" "}
                  <span className="text-gray-500 dark:text-gray-400">{explanation}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Relevant legislation */}
        {article.relevantLegislation?.length > 0 && (
          <div className="mt-6">
            <h2 className="text-sm font-semibold mb-2">Relevant legislation</h2>
            <ul className="flex flex-col gap-1">
              {article.relevantLegislation.map((leg, i) => (
                <li key={i} className="text-xs text-gray-500 dark:text-gray-400">
                  {leg}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Relevant case law */}
        {article.relevantCaseLaw?.length > 0 && (
          <div className="mt-6">
            <h2 className="flex items-center gap-1.5 text-sm font-semibold mb-2">
              <GavelIcon className="w-4 h-4 text-emerald-700" /> Relevant case law
            </h2>
            <ul className="flex flex-col gap-1">
              {article.relevantCaseLaw.map((c, i) => (
                <li key={i} className="text-xs text-gray-500 dark:text-gray-400">
                  {c}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Swahili translation toggle - only shown as a fallback add-on when we're NOT already
            displaying it as the lead explanation (i.e. when the person is reading in English but
            a translation is available) */}
        {article.swahiliTranslation && lang !== "sw" && (
          <details className="mt-6 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
            <summary className="flex items-center gap-1.5 text-sm font-medium cursor-pointer">
              <Languages className="w-4 h-4 text-emerald-700" /> Soma kwa Kiswahili
            </summary>
            <p className="text-sm leading-relaxed mt-3 text-gray-600 dark:text-gray-300">
              {article.swahiliTranslation}
            </p>
          </details>
        )}

        {article.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-6">
            {article.tags.map((tag) => (
              <span
                key={tag}
                className="text-[11px] rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 px-2.5 py-1"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {isCaseLaw && (
          <p className="text-xs text-gray-400 mt-6 pt-4 border-t border-gray-100 dark:border-gray-800">
            This is a summary for civic-education purposes, not a full judgment. Search the case
            name on{" "}
            <a
              href="https://new.kenyalaw.org/judgments/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-emerald-700"
            >
              Kenya Law (kenyalaw.org)
            </a>{" "}
            to read the complete decision.
          </p>
        )}

        {article.disclaimer && (
          <p className="text-[11px] text-gray-400 mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
            {article.disclaimer}
          </p>
        )}
      </article>
    </main>
  );
}