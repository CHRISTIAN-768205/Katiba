import React, { useEffect, useState } from "react";
import { Calendar, Loader2, Video, MapPin, Mail, CheckCircle, X } from "lucide-react";
import { getMyCalendar, completeRequest, cancelRequest } from "../api/client.js";

const TABS = [
  { key: "upcoming", label: "Upcoming" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
];

function dayLabel(date) {
  const d = new Date(date);
  const today = new Date();
  const isToday = d.toDateString() === today.toDateString();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const isTomorrow = d.toDateString() === tomorrow.toDateString();

  if (isToday) return "Today";
  if (isTomorrow) return "Tomorrow";
  return d.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
}

function timeRange(start, end) {
  const opts = { hour: "numeric", minute: "2-digit" };
  return `${new Date(start).toLocaleTimeString(undefined, opts)} - ${new Date(end).toLocaleTimeString(undefined, opts)}`;
}

/** Groups a sorted list of events into [{ dateKey, label, events }] buckets by calendar day. */
function groupByDay(events) {
  const groups = [];
  let current = null;
  for (const event of events) {
    const dateKey = new Date(event.startTime).toDateString();
    if (!current || current.dateKey !== dateKey) {
      current = { dateKey, label: dayLabel(event.startTime), events: [] };
      groups.push(current);
    }
    current.events.push(event);
  }
  return groups;
}

export default function AdvocateCalendar() {
  const [tab, setTab] = useState("upcoming");
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);

  function load() {
    setLoading(true);
    setError(null);
    getMyCalendar(tab)
      .then(setEvents)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(load, [tab]);

  async function handleAction(event, action) {
    setBusyId(event._id);
    setError(null);
    try {
      await action(event.requestId);
      setEvents((prev) => prev.filter((e) => e._id !== event._id));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  const groups = groupByDay(events);

  return (
    <main className="max-w-2xl mx-auto p-4 sm:p-6">
      <div className="flex items-center gap-2 mb-1">
        <Calendar className="w-5 h-5 text-emerald-700" />
        <h1 className="text-xl font-bold">Calendar</h1>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
        Every consultation here came from an accepted or confirmed request - nothing is added manually.
      </p>

      <div className="flex gap-2 mb-5">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${
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
      ) : events.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-12">
          {tab === "upcoming" ? "No upcoming consultations." : `No ${tab} consultations.`}
        </p>
      ) : (
        <div className="flex flex-col gap-6">
          {groups.map((group) => (
            <div key={group.dateKey}>
              <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">{group.label}</h2>
              <div className="flex flex-col gap-2">
                {group.events.map((event) => (
                  <div
                    key={event._id}
                    className="flex items-start gap-3 rounded-xl border border-gray-200 dark:border-gray-800 p-4"
                  >
                    <div className="w-9 h-9 rounded-full bg-emerald-800 text-white flex items-center justify-center text-xs font-semibold shrink-0">
                      {event.clientId?.name?.[0]?.toUpperCase() || "?"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm">{event.clientId?.name || "Unknown"}</span>
                        <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400 shrink-0">
                          {timeRange(event.startTime, event.endTime)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                        <Mail className="w-3 h-3" /> {event.clientId?.email}
                      </div>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          {event.consultationType === "virtual" ? (
                            <Video className="w-3.5 h-3.5" />
                          ) : (
                            <MapPin className="w-3.5 h-3.5" />
                          )}
                          {event.consultationType}
                        </span>
                        {event.locationOrLink && <span className="truncate">{event.locationOrLink}</span>}
                      </div>

                      {tab === "upcoming" && (
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={() => handleAction(event, cancelRequest)}
                            disabled={busyId === event._id}
                            className="flex items-center gap-1 rounded-full border border-gray-200 dark:border-gray-800 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 disabled:opacity-50"
                          >
                            <X className="w-3.5 h-3.5" /> Cancel
                          </button>
                          <button
                            onClick={() => handleAction(event, completeRequest)}
                            disabled={busyId === event._id}
                            className="flex items-center gap-1 rounded-full bg-emerald-800 text-white px-3 py-1.5 text-xs font-medium hover:bg-emerald-900 disabled:opacity-50"
                          >
                            {busyId === event._id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <CheckCircle className="w-3.5 h-3.5" />
                            )}
                            Mark Completed
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}