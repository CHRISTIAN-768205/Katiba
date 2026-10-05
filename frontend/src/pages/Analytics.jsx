import React, { useEffect, useState } from "react";
import { BarChart2, Loader2, Inbox, Briefcase, CheckCircle2, Clock, Star } from "lucide-react";
import { getMyAnalytics } from "../api/client.js";

function formatHours(hours) {
  if (hours === null) return "—";
  if (hours < 1) return `${Math.round(hours * 60)} min`;
  if (hours < 48) return `${hours.toFixed(1)} hrs`;
  return `${(hours / 24).toFixed(1)} days`;
}

function weekLabel(dateStr) {
  return new Date(dateStr).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function SummaryCard({ icon: Icon, label, value, sub }) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-4">
      <div className="flex items-center gap-2 mb-2 text-emerald-700">
        <Icon className="w-4 h-4" />
      </div>
      <div className="text-xl font-bold">{value}</div>
      <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</div>
      {sub && <div className="text-[11px] text-gray-400 mt-0.5">{sub}</div>}
    </div>
  );
}

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getMyAnalytics()
      .then((d) => !cancelled && setData(d))
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-gray-400 text-sm py-24 justify-center">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading…
      </div>
    );
  }
  if (error) {
    return <p className="text-sm text-red-600 text-center py-24">{error}</p>;
  }

  const maxWeekCount = Math.max(1, ...data.volumeByWeek.map((w) => w.count));
  const maxAreaCount = Math.max(1, ...data.practiceAreaBreakdown.map((a) => a.count));

  return (
    <main className="max-w-3xl mx-auto p-4 sm:p-6">
      <div className="flex items-center gap-2 mb-1">
        <BarChart2 className="w-5 h-5 text-emerald-700" />
        <h1 className="text-xl font-bold">Analytics</h1>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Computed from your actual consultations, cases, and reviews - nothing here is estimated.
      </p>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-8">
        <SummaryCard icon={Inbox} label="Total Requests" value={data.totalRequests} />
        <SummaryCard icon={Briefcase} label="Cases Opened" value={data.totalCases} />
        <SummaryCard
          icon={CheckCircle2}
          label="Acceptance Rate"
          value={data.acceptanceRate === null ? "—" : `${data.acceptanceRate.toFixed(0)}%`}
        />
        <SummaryCard icon={Clock} label="Avg. Response Time" value={formatHours(data.avgResponseTimeHours)} />
        <SummaryCard
          icon={Star}
          label="Avg. Rating"
          value={data.avgRating === null ? "—" : data.avgRating.toFixed(1)}
          sub={data.reviewCount > 0 ? `${data.reviewCount} review${data.reviewCount === 1 ? "" : "s"}` : null}
        />
      </div>

      {/* Consultation volume */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold mb-3">Consultation Requests - Last 12 Weeks</h2>
        {data.volumeByWeek.length === 0 ? (
          <p className="text-sm text-gray-400 rounded-xl border border-dashed border-gray-200 dark:border-gray-800 p-6 text-center">
            No requests in this period yet.
          </p>
        ) : (
          <div className="flex items-end gap-1.5 h-32 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
            {data.volumeByWeek.map((w) => (
              <div key={w.weekStart} className="flex-1 flex flex-col items-center justify-end h-full gap-1">
                <div
                  className="w-full bg-emerald-700 dark:bg-emerald-600 rounded-t"
                  style={{ height: `${(w.count / maxWeekCount) * 100}%`, minHeight: w.count > 0 ? "4px" : "0" }}
                  title={`${w.count} request${w.count === 1 ? "" : "s"}`}
                />
                <span className="text-[9px] text-gray-400 rotate-0">{weekLabel(w.weekStart)}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Practice area breakdown */}
      <section>
        <h2 className="text-sm font-semibold mb-3">Common Legal Topics (by cases opened)</h2>
        {data.practiceAreaBreakdown.length === 0 ? (
          <p className="text-sm text-gray-400 rounded-xl border border-dashed border-gray-200 dark:border-gray-800 p-6 text-center">
            No cases opened yet.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {data.practiceAreaBreakdown.map((a) => (
              <div key={a.practiceArea} className="flex items-center gap-3">
                <span className="text-xs text-gray-600 dark:text-gray-300 w-40 shrink-0 truncate">
                  {a.practiceArea}
                </span>
                <div className="flex-1 h-5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-700 dark:bg-emerald-600 rounded-full"
                    style={{ width: `${(a.count / maxAreaCount) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-gray-400 w-6 text-right shrink-0">{a.count}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}