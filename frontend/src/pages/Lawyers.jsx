import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Users, BadgeCheck, Mail, Loader2, X, Send, CheckCircle2, Video, MapPin } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { getAdvocates, sendConsultationRequest } from "../api/client.js";

function defaultDateTimeValue() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(9, 0, 0, 0);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

export default function Lawyers() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const [advocates, setAdvocates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeAdvocate, setActiveAdvocate] = useState(null);
  const [message, setMessage] = useState("");
  const [requestedDate, setRequestedDate] = useState(defaultDateTimeValue());
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [consultationType, setConsultationType] = useState("virtual");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState(null);
  const [sentTo, setSentTo] = useState(new Set());

  useEffect(() => {
    let cancelled = false;
    getAdvocates()
      .then((data) => !cancelled && setAdvocates(data))
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  function openRequestModal(advocate) {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: "/lawyers" } });
      return;
    }
    setActiveAdvocate(advocate);
    setMessage("");
    setRequestedDate(defaultDateTimeValue());
    setDurationMinutes(30);
    setConsultationType("virtual");
    setSendError(null);
  }

  async function handleSend() {
    if (!message.trim() || !requestedDate) return;
    setSending(true);
    setSendError(null);
    try {
      await sendConsultationRequest(activeAdvocate._id, {
        message: message.trim(),
        requestedDate: new Date(requestedDate).toISOString(),
        durationMinutes,
        consultationType,
      });
      setSentTo((prev) => new Set(prev).add(activeAdvocate._id));
      setActiveAdvocate(null);
    } catch (err) {
      setSendError(err.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="max-w-4xl mx-auto p-4 sm:p-6">
      <div className="flex items-center gap-2 mb-1">
        <Users className="w-5 h-5 text-emerald-700" />
        <h1 className="text-xl font-bold">Lawyer Directory</h1>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Registered advocates on Katiba AI. Propose a time, and they can accept, decline, or suggest
        another time - you'll be notified by email either way.
      </p>

      {loading ? (
        <div className="flex items-center gap-2 text-gray-400 text-sm py-12 justify-center">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading advocates…
        </div>
      ) : error ? (
        <p className="text-sm text-red-600 text-center py-12">{error}</p>
      ) : advocates.length === 0 ? (
        <div className="text-sm text-gray-400 rounded-xl border border-dashed border-gray-200 dark:border-gray-800 p-6 text-center">
          No advocates have registered yet. Once someone signs up choosing the "Advocate" role,
          they'll appear here.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {advocates.map((adv) => {
            const alreadySent = sentTo.has(adv._id);
            const isSelf = user?._id === adv._id;
            return (
              <div
                key={adv._id}
                className="rounded-xl border border-gray-200 dark:border-gray-800 p-4 flex items-start gap-3"
              >
                <div className="w-10 h-10 rounded-full bg-emerald-800 text-white flex items-center justify-center font-semibold shrink-0">
                  {adv.name?.[0]?.toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-sm truncate">{adv.name}</span>
                    {adv.advocateVerified && (
                      <BadgeCheck className="w-4 h-4 text-emerald-600 shrink-0" aria-label="Verified" />
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                    <Mail className="w-3 h-3" /> {adv.email}
                  </div>
                  {!adv.advocateVerified && (
                    <span className="inline-block mt-1.5 text-[10px] uppercase tracking-wide text-amber-600 bg-amber-50 dark:bg-amber-950/50 rounded-full px-2 py-0.5">
                      Unverified
                    </span>
                  )}

                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => navigate(`/lawyers/${adv._id}`)}
                      className="rounded-full border border-gray-200 dark:border-gray-800 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      View Profile
                    </button>
                    {isSelf ? null : alreadySent ? (
                      <div className="flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Request sent
                      </div>
                    ) : (
                      <button
                        onClick={() => openRequestModal(adv)}
                        className="flex items-center gap-1.5 rounded-full bg-emerald-800 text-white px-3 py-1.5 text-xs font-medium hover:bg-emerald-900"
                      >
                        <Send className="w-3.5 h-3.5" /> Request
                      </button>
                    )}
                  </div>
                  {isSelf && <p className="text-xs text-gray-400 mt-1">This is you.</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeAdvocate && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-sm">Request consultation with {activeAdvocate.name}</h2>
              <button onClick={() => setActiveAdvocate(null)} className="text-gray-400 hover:text-gray-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">What do you need help with?</label>
            <textarea
              autoFocus
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              placeholder="Briefly describe your situation..."
              className="w-full mt-1 mb-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-600 resize-none"
            />

            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Preferred date & time</label>
            <input
              type="datetime-local"
              value={requestedDate}
              onChange={(e) => setRequestedDate(e.target.value)}
              className="w-full mt-1 mb-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-600"
            />

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Duration</label>
                <select
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  className="w-full mt-1 rounded-lg border border-gray-200 dark:border-gray-800 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-600"
                >
                  <option value={30}>30 minutes</option>
                  <option value={60}>1 hour</option>
                  <option value={90}>1.5 hours</option>
                  <option value={120}>2 hours</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Type</label>
                <div className="flex gap-1.5 mt-1">
                  <button
                    type="button"
                    onClick={() => setConsultationType("virtual")}
                    className={`flex-1 flex items-center justify-center gap-1 rounded-lg border px-2 py-2 text-xs font-medium ${
                      consultationType === "virtual"
                        ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300"
                        : "border-gray-200 dark:border-gray-800 text-gray-500"
                    }`}
                  >
                    <Video className="w-3.5 h-3.5" /> Virtual
                  </button>
                  <button
                    type="button"
                    onClick={() => setConsultationType("physical")}
                    className={`flex-1 flex items-center justify-center gap-1 rounded-lg border px-2 py-2 text-xs font-medium ${
                      consultationType === "physical"
                        ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300"
                        : "border-gray-200 dark:border-gray-800 text-gray-500"
                    }`}
                  >
                    <MapPin className="w-3.5 h-3.5" /> In-person
                  </button>
                </div>
              </div>
            </div>

            {sendError && <p className="text-sm text-red-600 mb-2">{sendError}</p>}
            <button
              onClick={handleSend}
              disabled={sending || !message.trim() || !requestedDate}
              className="w-full flex items-center justify-center gap-2 rounded-full bg-emerald-800 text-white px-4 py-2.5 text-sm font-medium hover:bg-emerald-900 disabled:opacity-50"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Send Request
            </button>
          </div>
        </div>
      )}
    </main>
  );
}