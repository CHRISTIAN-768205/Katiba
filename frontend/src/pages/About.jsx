import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Scale, Search, Languages, ShieldAlert, BookOpen, Loader2 } from "lucide-react";
import { useApp } from "../context/AppContext.jsx";
import { getLawSources } from "../api/client.js";

export default function About() {
  const { t } = useApp();
  const navigate = useNavigate();
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getLawSources()
      .then((data) => !cancelled && setSources(data))
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const totalEntries = sources.reduce((sum, s) => sum + s.articleCount, 0);

  const steps = [
    { icon: Search, titleKey: "about.step1.title", bodyKey: "about.step1.body" },
    { icon: BookOpen, titleKey: "about.step2.title", bodyKey: "about.step2.body" },
    { icon: Scale, titleKey: "about.step3.title", bodyKey: "about.step3.body" },
  ];

  return (
    <main className="max-w-3xl mx-auto p-4 sm:p-6">
      {/* Hero */}
      <div className="text-center py-8">
        <div className="w-14 h-14 rounded-xl bg-emerald-800 flex items-center justify-center mx-auto mb-4">
          <Scale className="w-7 h-7 text-amber-400" />
        </div>
        <h1 className="text-2xl font-bold mb-2">{t("about.title")}</h1>
        <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto">{t("about.mission")}</p>
      </div>

      {/* How it works */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold mb-4">{t("about.howItWorks")}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {steps.map((step, i) => (
            <div key={step.titleKey} className="rounded-xl border border-gray-200 dark:border-gray-800 p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-900 flex items-center justify-center text-xs font-bold text-emerald-700 dark:text-emerald-300">
                  {i + 1}
                </div>
                <step.icon className="w-4 h-4 text-emerald-700" />
              </div>
              <h3 className="font-semibold text-sm mb-1">{t(step.titleKey)}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{t(step.bodyKey)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Languages */}
      <section className="mb-10 rounded-xl border border-gray-200 dark:border-gray-800 p-5 flex items-start gap-3">
        <Languages className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
        <div>
          <h3 className="font-semibold text-sm mb-1">{t("about.languages.title")}</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{t("about.languages.body")}</p>
        </div>
      </section>

      {/* What's covered - live from the backend */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold mb-1">{t("about.coverage.title")}</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          {loading ? t("about.coverage.loading") : `${totalEntries} ${t("about.coverage.entries")}`}
        </p>
        {loading ? (
          <div className="flex items-center gap-2 text-gray-400 text-sm py-6 justify-center">
            <Loader2 className="w-4 h-4 animate-spin" />
          </div>
        ) : sources.length === 0 ? (
          <p className="text-sm text-gray-400">{t("about.coverage.empty")}</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {sources.map((s) => (
              <span
                key={s.lawSource}
                className="text-xs rounded-full border border-gray-200 dark:border-gray-800 px-3 py-1.5 text-gray-600 dark:text-gray-300"
              >
                {s.lawSource} <span className="text-gray-400">· {s.articleCount}</span>
              </span>
            ))}
          </div>
        )}
        <button
          onClick={() => navigate("/laws")}
          className="mt-4 text-sm font-medium text-emerald-700 dark:text-emerald-400"
        >
          {t("about.coverage.browse")} →
        </button>
      </section>

      {/* Disclaimer */}
      <section className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/40 dark:border-amber-900 p-5 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <h3 className="font-semibold text-sm mb-1 text-amber-800 dark:text-amber-300">
            {t("about.disclaimer.title")}
          </h3>
          <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">{t("about.disclaimer.body")}</p>
        </div>
      </section>
    </main>
  );
}