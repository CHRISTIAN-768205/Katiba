import React, { useEffect, useState } from "react";
import {
  Inbox,
  Loader2,
  Mail,
  CalendarClock,
  Video,
  MapPin,
  Check,
  X,
  Star,
} from "lucide-react";
import {
  getSentRequests,
  confirmReschedule,
  declineReschedule,
  cancelRequest,
  getPendingReviews,
  submitReview,
} from "../api/client.js";

const TABS = [
  { key: "pending", label: "Pending" },
  { key: "reschedule_proposed", label: "Needs Your Reply" },
  { key: "accepted", label: "Upcoming" },
  { key: "completed", label: "Completed" },
  { key: "rejected", label: "Rejected" },
  { key: "cancelled", label: "Cancelled" },
];

const STATUS_STYLES = {
  pending: "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400",
  reschedule_proposed: "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400",
  accepted: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400",
  completed: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  rejected: "bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-400",
  cancelled: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500",
};

function fmt(date) {
  return new Date(date).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export default function MyRequests() {
  const [tab, setTab] = useState("pending");
  const [allRequests, setAllRequests] = useState([]);
  const [pendingReviewIds, setPendingReviewIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const [reviewing, setReviewing] = useState(null); // the request currently being reviewed
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  function load() {
    setLoading(true);
    setError(null);
    Promise.all([getSentRequests(), getPendingReviews()])
      .then(([requests, pending]) => {
        setAllRequests(requests);
        setPendingReviewIds(new Set(pending.map((p) => p._id)));
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  const filtered = allRequests.filter((r) => r.status === tab);

  async function handleAction(id, action) {
    setBusyId(id);
    setError(null);
    try {
      await action(id);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  function openReview(request) {
    setReviewing(request);
    setRating(5);
    setComment("");
  }

  async function handleSubmitReview() {
    setSubmittingReview(true);
    setError(null);
    try {
      await submitReview(reviewing._id, rating, comment.trim());
      setPendingReviewIds((prev) => {
        const next = new Set(prev);
        next.delete(reviewing._id);
        return next;
      });
      setReviewing(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmittingReview(false);
    }
  }

  return (
    <main className="max-w-2xl mx-auto p-4 sm:p-6">
      <div className="flex items-center gap-2 mb-1">
        <Inbox className="w-5 h-5 text-emerald-700" />
        <h1 className="text-xl font-bold">My Requests</h1>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
        Every consultation request you've sent, and its status.
      </p>

      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium ${
              tab === t.key
                ? "bg-emerald-800 text-white"
                : "border border-gray-200 dark:border-gray-800 text-gray-500"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

      {loading ? (
        <div className="flex items-center gap-2 text-gray-400 text-sm py-12 justify-center">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading…
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-12">Nothing here.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((r) => (
            <div key={r._id} className="rounded-xl border border-gray-200 dark:border-gray-800 p-4">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-800 text-white flex items-center justify-center text-xs font-semibold">
                    {r.advocateId?.name?.[0]?.toUpperCase() || "?"}
                  </div>
                  <div>
                    <div className="text-sm font-medium">{r.advocateId?.name || "Unknown"}</div>
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <Mail className="w-3 h-3" /> {r.advocateId?.email}
                    </div>
                  </div>
                </div>
                <span className={`text-[10px] uppercase tracking-wide rounded-full px-2 py-0.5 ${STATUS_STYLES[r.status]}`}>
                  {r.status.replace("_", " ")}
                </span>
              </div>

              <p className="text-sm mt-2 text-gray-700 dark:text-gray-300">{r.message}</p>

              <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <CalendarClock className="w-3.5 h-3.5" />
                  {r.status === "reschedule_proposed"
                    ? `Proposed: ${fmt(r.proposedDate)}`
                    : r.confirmedDate
                    ? fmt(r.confirmedDate)
                    : `Requested: ${fmt(r.requestedDate)}`}
                  {" · "}
                  {r.durationMinutes} min
                </span>
                <span className="flex items-center gap-1">
                  {r.consultationType === "virtual" ? <Video className="w-3.5 h-3.5" /> : <MapPin className="w-3.5 h-3.5" />}
                  {r.consultationType}
                </span>
              </div>

              {r.status === "reschedule_proposed" && r.rescheduleNote && (
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-2 italic">"{r.rescheduleNote}"</p>
              )}

              {r.status === "accepted" && r.locationOrLink && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{r.locationOrLink}</p>
              )}

              <div className="flex items-center justify-end mt-3">
                {r.status === "reschedule_proposed" && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAction(r._id, declineReschedule)}
                      disabled={busyId === r._id}
                      className="rounded-full border border-gray-200 dark:border-gray-800 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 disabled:opacity-50"
                    >
                      Decline
                    </button>
                    <button
                      onClick={() => handleAction(r._id, confirmReschedule)}
                      disabled={busyId === r._id}
                      className="flex items-center gap-1 rounded-full bg-emerald-800 text-white px-3 py-1.5 text-xs font-medium hover:bg-emerald-900 disabled:opacity-50"
                    >
                      {busyId === r._id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      Confirm New Time
                    </button>
                  </div>
                )}

                {r.status === "accepted" && (
                  <button
                    onClick={() => handleAction(r._id, cancelRequest)}
                    disabled={busyId === r._id}
                    className="flex items-center gap-1 rounded-full border border-gray-200 dark:border-gray-800 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 disabled:opacity-50"
                  >
                    <X className="w-3.5 h-3.5" /> Cancel
                  </button>
                )}

                {r.status === "completed" && pendingReviewIds.has(r._id) && (
                  <button
                    onClick={() => openReview(r)}
                    className="flex items-center gap-1 rounded-full bg-amber-400 text-emerald-950 px-3 py-1.5 text-xs font-semibold hover:bg-amber-300"
                  >
                    <Star className="w-3.5 h-3.5" /> Leave a Review
                  </button>
                )}
                {r.status === "completed" && !pendingReviewIds.has(r._id) && (
                  <span className="text-xs text-gray-400">Reviewed ✓</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review modal */}
      {reviewing && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5">
            <h2 className="font-semibold text-sm mb-1">Review {reviewing.advocateId?.name}</h2>
            <p className="text-xs text-gray-400 mb-4">How was your consultation?</p>

            <div className="flex items-center justify-center gap-1 mb-4">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} onClick={() => setRating(n)} aria-label={`${n} stars`}>
                  <Star
                    className={`w-8 h-8 ${n <= rating ? "fill-amber-400 text-amber-400" : "text-gray-200 dark:text-gray-700"}`}
                  />
                </button>
              ))}
            </div>

            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              placeholder="Optional - share more about your experience..."
              className="w-full mb-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-600 resize-none"
            />

            <div className="flex gap-2">
              <button
                onClick={() => setReviewing(null)}
                className="flex-1 rounded-full border border-gray-200 dark:border-gray-800 px-4 py-2.5 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitReview}
                disabled={submittingReview}
                className="flex-1 flex items-center justify-center gap-2 rounded-full bg-emerald-800 text-white px-4 py-2.5 text-sm font-medium hover:bg-emerald-900 disabled:opacity-50"
              >
                {submittingReview ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}