import React, { useEffect, useState } from "react";
import { Star, Loader2 } from "lucide-react";
import { getMyReviews } from "../api/client.js";

function Stars({ value }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`w-4 h-4 ${n <= Math.round(value) ? "fill-amber-400 text-amber-400" : "text-gray-200 dark:text-gray-700"}`}
        />
      ))}
    </div>
  );
}

export default function Reviews() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getMyReviews()
      .then((d) => !cancelled && setData(d))
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="max-w-2xl mx-auto p-4 sm:p-6">
      <div className="flex items-center gap-2 mb-1">
        <Star className="w-5 h-5 text-emerald-700" />
        <h1 className="text-xl font-bold">Reviews</h1>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        From clients who left a review after a completed consultation.
      </p>

      {loading ? (
        <div className="flex items-center gap-2 text-gray-400 text-sm py-12 justify-center">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading…
        </div>
      ) : error ? (
        <p className="text-sm text-red-600 text-center py-12">{error}</p>
      ) : data.count === 0 ? (
        <div className="text-sm text-gray-400 rounded-xl border border-dashed border-gray-200 dark:border-gray-800 p-6 text-center">
          No reviews yet. They'll appear here once a client reviews a completed consultation.
        </div>
      ) : (
        <>
          <div className="flex items-center gap-4 rounded-xl border border-gray-200 dark:border-gray-800 p-5 mb-5">
            <div className="text-3xl font-bold">{data.average.toFixed(1)}</div>
            <div>
              <Stars value={data.average} />
              <div className="text-xs text-gray-400 mt-0.5">
                Based on {data.count} review{data.count === 1 ? "" : "s"}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {data.reviews.map((r) => (
              <div key={r._id} className="rounded-xl border border-gray-200 dark:border-gray-800 p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">{r.clientId?.name || "Anonymous"}</span>
                  <Stars value={r.rating} />
                </div>
                {r.comment && <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{r.comment}</p>}
                <p className="text-[11px] text-gray-400 mt-2">{new Date(r.createdAt).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </main>
  );
}