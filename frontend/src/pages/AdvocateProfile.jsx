import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  BadgeCheck,
  Mail,
  Briefcase,
  Star,
  Loader2,
  X,
  Send,
  Video,
  MapPin,
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { getAdvocateProfile, sendConsultationRequest } from "../api/client.js";

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

function defaultDateTimeValue() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(9, 0, 0, 0);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

export default function AdvocateProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showRequest, setShowRequest] = useState(false);
  const [message, setMessage] = useState("");
  const [requestedDate, setRequestedDate] = useState(defaultDateTimeValue());
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [consultationType, setConsultationType] = useState("virtual");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState(null);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getAdvocateProfile(id)
      .then((d) => !cancelled && setData(d))
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [id]);

  function openRequest() {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: `/lawyers/${id}` } });
      return;
    }
    setShowRequest(true);
    setMessage("");
    setRequestedDate(defaultDateTimeValue());
    setSendError(null);
  }

  async function handleSend() {
    if (!message.trim() || !requestedDate) return;
    setSending(true);
    setSendError(null);
    try {
      await sendConsultationRequest(id, {
        message: message.trim(),
        requestedDate: new Date(requestedDate).toISOString(),
        durationMinutes,
        consultationType,
      });
      setShowRequest(false);
      setSent(true);
    } catch (err) {
      setSendError(err.message);
    } finally {
      setSending(false);
    }
  }

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

  const { advocate, reviews, averageRating, reviewCount } = data;
  const isSelf = user?._id === advocate._id;

  return (
    <main className="max-w-2xl mx-auto p-4 sm:p-6">
      <button
        onClick={() => navigate("/lawyers")}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-emerald-700 mb-4"
      >
        <ArrowLeft className="w-4 h-4" /> Lawyer Directory
      </button>

      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-5 mb-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-full bg-emerald-800 text-white flex items-center justify-center text-2xl font-semibold shrink-0">
            {advocate.name?.[0]?.toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h1 className="text-lg font-bold">{advocate.name}</h1>
              {advocate.advocateVerified && <BadgeCheck className="w-4 h-4 text-emerald-600 shrink-0" />}
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
              <Mail className="w-3 h-3" /> {advocate.email}
            </div>
            {averageRating !== null && (
              <div className="flex items-center gap-1.5 mt-1.5">
                <Stars value={averageRating} />
                <span className="text-xs text-gray-400">
                  {averageRating.toFixed(1)} ({reviewCount} review{reviewCount === 1 ? "" : "s"})
                </span>
              </div>
            )}
            {advocate.yearsOfExperience != null && (
              <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mt-1.5">
                <Briefcase className="w-3.5 h-3.5" /> {advocate.yearsOfExperience} years of experience
              </div>
            )}
          </div>
        </div>

        {advocate.bio && (
          <p className="text-sm text-gray-700 dark:text-gray-300 mt-4 leading-relaxed">{advocate.bio}</p>
        )}

        {advocate.practiceAreas?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-4">
            {advocate.practiceAreas.map((area) => (
              <span
                key={area}
                className="text-xs rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 px-2.5 py-1"
              >
                {area}
              </span>
            ))}
          </div>
        )}

        {isSelf ? (
          <p className="text-xs text-gray-400 mt-5">This is your own public profile.</p>
        ) : sent ? (
          <p className="text-sm text-emerald-700 dark:text-emerald-400 mt-5">Request sent ✓</p>
        ) : (
          <button
            onClick={openRequest}
            className="mt-5 flex items-center gap-1.5 rounded-full bg-emerald-800 text-white px-4 py-2 text-sm font-medium hover:bg-emerald-900"
          >
            <Send className="w-4 h-4" /> Request Consultation
          </button>
        )}
      </div>

      <h2 className="text-sm font-semibold mb-3">Reviews</h2>
      {reviews.length === 0 ? (
        <p className="text-sm text-gray-400">No reviews yet.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {reviews.map((r) => (
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
      )}

      {showRequest && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-sm">Request consultation with {advocate.name}</h2>
              <button onClick={() => setShowRequest(false)} className="text-gray-400 hover:text-gray-700">
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