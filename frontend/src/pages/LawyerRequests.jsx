
import React, { useEffect, useState } from "react";
import { Mail, Loader2, Check, X, Clock, CalendarClock, Video, MapPin, CheckCircle } from "lucide-react";
import {
  getReceivedRequests,
  acceptRequest,
  rejectRequest,
  proposeReschedule,
  completeRequest,
  cancelRequest,
} from "../api/client.js";

const TABS = [
  { key: "pending", label: "Pending" },
  { key: "reschedule_proposed", label: "Awaiting Client" },
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

export default function LawyerRequests() {
  const [tab, setTab] = useState("pending");
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [rescheduling, setRescheduling] = useState(null); // request currently being rescheduled
  const [proposedDate, setProposedDate] = useState("");
  const [rescheduleNote, setRescheduleNote] = useState("");

  function load() {
    setLoading(true);
    setError(null);
    getReceivedRequests(tab)
      .then(setRequests)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(load, [tab]);

  async function handleAction(id, action, ...args) {
    setBusyId(id);
    setError(null);
    try {
      await action(id, ...args);
      setRequests((prev) => prev.filter((r) => r._id !== id));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  async function submitReschedule() {
    if (!proposedDate) return;
    setBusyId(rescheduling._id);
    setError(null);
    try {
      await proposeReschedule(rescheduling._id, new Date(proposedDate).toISOString(), rescheduleNote);
      setRequests((prev) => prev.filter((r) => r._id !== rescheduling._id));
      setRescheduling(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <main className="max-w-2xl mx-auto p-4 sm:p-6">
      <h1 className="text-lg font-bold mb-1">Consultation Requests</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
        Requests from citizens who found you through the Lawyer Directory.
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
      ) : requests.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-12">Nothing here.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {requests.map((r) => (
            <div key={r._id} className="rounded-xl border border-gray-200 dark:border-gray-800 p-4">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-800 text-white flex items-center justify-center text-xs font-semibold">
                    {r.clientId?.name?.[0]?.toUpperCase() || "?"}
                  </div>
                  <div>
                    <div className="text-sm font-medium">{r.clientId?.name || "Unknown"}</div>
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <Mail className="w-3 h-3" /> {r.clientId?.email}
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

              {r.status === "reschedule_proposed" && (
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                  Waiting for the client to confirm this new time.
                </p>
              )}

              <div className="flex items-center justify-between mt-3">
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <Clock className="w-3 h-3" /> {new Date(r.createdAt).toLocaleDateString()}
                </span>

                {r.status === "pending" && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAction(r._id, rejectRequest)}
                      disabled={busyId === r._id}
                      className="rounded-full border border-gray-200 dark:border-gray-800 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 disabled:opacity-50"
                    >
                      Deny
                    </button>
                    <button
                      onClick={() => {
                        setRescheduling(r);
                        setProposedDate("");
                        setRescheduleNote("");
                      }}
                      disabled={busyId === r._id}
                      className="rounded-full border border-gray-200 dark:border-gray-800 px-3 py-1.5 text-xs font-medium hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
                    >
                      Reschedule
                    </button>
                    <button
                      onClick={() => handleAction(r._id, acceptRequest)}
                      disabled={busyId === r._id}
                      className="flex items-center gap-1 rounded-full bg-emerald-800 text-white px-3 py-1.5 text-xs font-medium hover:bg-emerald-900 disabled:opacity-50"
                    >
                      {busyId === r._id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      Accept
                    </button>
                  </div>
                )}

                {r.status === "accepted" && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAction(r._id, cancelRequest)}
                      disabled={busyId === r._id}
                      className="rounded-full border border-gray-200 dark:border-gray-800 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleAction(r._id, completeRequest)}
                      disabled={busyId === r._id}
                      className="flex items-center gap-1 rounded-full bg-emerald-800 text-white px-3 py-1.5 text-xs font-medium hover:bg-emerald-900 disabled:opacity-50"
                    >
                      <CheckCircle className="w-3.5 h-3.5" /> Mark Completed
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reschedule modal */}
      {rescheduling && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-sm">Propose a new time</h2>
              <button onClick={() => setRescheduling(null)} className="text-gray-400 hover:text-gray-700">
                <X className="w-4 h-4" />
              </button>
            </div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">New date & time</label>
            <input
              type="datetime-local"
              value={proposedDate}
              onChange={(e) => setProposedDate(e.target.value)}
              className="w-full mt-1 mb-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-600"
            />
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Note (optional)</label>
            <textarea
              value={rescheduleNote}
              onChange={(e) => setRescheduleNote(e.target.value)}
              rows={2}
              placeholder="e.g. I'm unavailable then, but free at this time instead."
              className="w-full mt-1 mb-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-600 resize-none"
            />
            <button
              onClick={submitReschedule}
              disabled={!proposedDate || busyId === rescheduling._id}
              className="w-full flex items-center justify-center gap-2 rounded-full bg-emerald-800 text-white px-4 py-2.5 text-sm font-medium hover:bg-emerald-900 disabled:opacity-50"
            >
              {busyId === rescheduling._id ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send Proposal"}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}