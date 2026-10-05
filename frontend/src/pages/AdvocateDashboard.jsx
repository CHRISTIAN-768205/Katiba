import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Calendar,
  Briefcase,
  Star,
  Wallet,
  Inbox,
  MessageSquare,
  Bot,
  BookOpen,
  Scale,
  FileText,
  PenSquare,
  Lightbulb,
  ArrowRight,
  Loader2,
  X,
  Copy,
  Check,
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import {
  getReceivedRequests,
  getMyClients,
  getMyCases,
  getMyCalendar,
  getMyReviews,
  getThreads,
  draftDemandLetter,
  summarizeContract,
} from "../api/client.js";

function ComingSoonBadge() {
  return (
    <span className="text-[9px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 rounded-full px-2 py-0.5">
      Coming soon
    </span>
  );
}

function isToday(date) {
  const d = new Date(date);
  const today = new Date();
  return d.toDateString() === today.toDateString();
}

function timeAgo(date) {
  const diffMs = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(date).toLocaleDateString();
}

function DemandLetterModal({ onClose, senderName }) {
  const [recipientName, setRecipientName] = useState("");
  const [facts, setFacts] = useState("");
  const [desiredOutcome, setDesiredOutcome] = useState("");
  const [deadline, setDeadline] = useState("14 days from the date of this letter");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [letter, setLetter] = useState(null);
  const [copied, setCopied] = useState(false);

  async function handleGenerate() {
    if (!recipientName.trim() || !facts.trim() || !desiredOutcome.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const result = await draftDemandLetter({ senderName, recipientName, facts, desiredOutcome, deadline });
      setLetter(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(letter);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-semibold text-sm flex items-center gap-2">
            <PenSquare className="w-4 h-4 text-emerald-700" /> Draft Demand Letter
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-gray-400 mb-4">
          A first draft for you to review and finalize - not a finished document to send as-is.
        </p>

        {!letter ? (
          <>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Recipient name</label>
            <input
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              placeholder="e.g. John Mwangi"
              className="w-full mt-1 mb-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-600"
            />

            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Facts of the matter</label>
            <textarea
              value={facts}
              onChange={(e) => setFacts(e.target.value)}
              rows={4}
              placeholder="What happened - be specific, this becomes the body of the letter"
              className="w-full mt-1 mb-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-600 resize-none"
            />

            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Desired outcome</label>
            <textarea
              value={desiredOutcome}
              onChange={(e) => setDesiredOutcome(e.target.value)}
              rows={2}
              placeholder="e.g. Payment of KES 150,000 owed under the contract dated..."
              className="w-full mt-1 mb-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-600 resize-none"
            />

            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Deadline for compliance</label>
            <input
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full mt-1 mb-4 rounded-lg border border-gray-200 dark:border-gray-800 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-600"
            />

            {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
            <button
              onClick={handleGenerate}
              disabled={loading || !recipientName.trim() || !facts.trim() || !desiredOutcome.trim()}
              className="w-full flex items-center justify-center gap-2 rounded-full bg-emerald-800 text-white px-4 py-2.5 text-sm font-medium hover:bg-emerald-900 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Generate Draft"}
            </button>
          </>
        ) : (
          <>
            <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-4 text-sm whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto mb-4">
              {letter}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setLetter(null)}
                className="flex-1 rounded-full border border-gray-200 dark:border-gray-800 px-4 py-2.5 text-sm font-medium"
              >
                Start Over
              </button>
              <button
                onClick={handleCopy}
                className="flex-1 flex items-center justify-center gap-2 rounded-full bg-emerald-800 text-white px-4 py-2.5 text-sm font-medium hover:bg-emerald-900"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? "Copied" : "Copy Text"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function SummarizeContractModal({ onClose }) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState(null);
  const [copied, setCopied] = useState(false);

  const MAX_LENGTH = 20000;

  async function handleSummarize() {
    if (!text.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const result = await summarizeContract(text);
      setSummary(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-semibold text-sm flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-700" /> Summarize Contract
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-gray-400 mb-4">
          Paste the contract text below. This is a review aid, not a substitute for reading the
          full document yourself.
        </p>

        {!summary ? (
          <>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={10}
              maxLength={MAX_LENGTH}
              placeholder="Paste the full contract text here..."
              className="w-full rounded-lg border border-gray-200 dark:border-gray-800 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-600 resize-none font-mono"
            />
            <p className="text-[11px] text-gray-400 mt-1 mb-3 text-right">
              {text.length.toLocaleString()}/{MAX_LENGTH.toLocaleString()}
            </p>

            {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
            <button
              onClick={handleSummarize}
              disabled={loading || !text.trim()}
              className="w-full flex items-center justify-center gap-2 rounded-full bg-emerald-800 text-white px-4 py-2.5 text-sm font-medium hover:bg-emerald-900 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Summarize"}
            </button>
          </>
        ) : (
          <>
            <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-4 text-sm whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto mb-4">
              {summary}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setSummary(null)}
                className="flex-1 rounded-full border border-gray-200 dark:border-gray-800 px-4 py-2.5 text-sm font-medium"
              >
                Summarize Another
              </button>
              <button
                onClick={handleCopy}
                className="flex-1 flex items-center justify-center gap-2 rounded-full bg-emerald-800 text-white px-4 py-2.5 text-sm font-medium hover:bg-emerald-900"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? "Copied" : "Copy Text"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function AdvocateDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [pendingCount, setPendingCount] = useState(null);
  const [clientCount, setClientCount] = useState(null);
  const [activeCaseCount, setActiveCaseCount] = useState(null);
  const [appointmentsTodayCount, setAppointmentsTodayCount] = useState(null);
  const [rating, setRating] = useState(null);
  const [upcomingEvents, setUpcomingEvents] = useState(null);
  const [threads, setThreads] = useState(null);
  const [showDemandLetter, setShowDemandLetter] = useState(false);
  const [showSummarize, setShowSummarize] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getReceivedRequests("pending")
      .then((data) => !cancelled && setPendingCount(data.length))
      .catch(() => !cancelled && setPendingCount(null));
    getMyClients()
      .then((data) => !cancelled && setClientCount(data.length))
      .catch(() => !cancelled && setClientCount(null));
    Promise.all([getMyCases("open"), getMyCases("in_progress")])
      .then(([open, inProgress]) => !cancelled && setActiveCaseCount(open.length + inProgress.length))
      .catch(() => !cancelled && setActiveCaseCount(null));
    getMyCalendar("upcoming")
      .then((events) => {
        if (cancelled) return;
        setAppointmentsTodayCount(events.filter((e) => isToday(e.startTime)).length);
        setUpcomingEvents(events.slice(0, 4));
      })
      .catch(() => {
        if (!cancelled) {
          setAppointmentsTodayCount(null);
          setUpcomingEvents([]);
        }
      });
    getMyReviews()
      .then((data) => !cancelled && setRating(data))
      .catch(() => !cancelled && setRating(null));
    getThreads()
      .then((data) => !cancelled && setThreads(data.slice(0, 4)))
      .catch(() => !cancelled && setThreads([]));
    return () => {
      cancelled = true;
    };
  }, []);

  const loadingIcon = <Loader2 className="w-4 h-4 animate-spin" />;

  const statCards = [
    {
      icon: Users,
      label: "Total Clients",
      value: clientCount === null ? loadingIcon : clientCount,
      comingSoon: false,
      onClick: () => navigate("/lawyer/clients"),
    },
    {
      icon: Calendar,
      label: "Appointments Today",
      value: appointmentsTodayCount === null ? loadingIcon : appointmentsTodayCount,
      comingSoon: false,
      onClick: () => navigate("/lawyer/calendar"),
    },
    {
      icon: Briefcase,
      label: "Active Cases",
      value: activeCaseCount === null ? loadingIcon : activeCaseCount,
      comingSoon: false,
      onClick: () => navigate("/lawyer/cases"),
    },
    {
      icon: Star,
      label: "Rating",
      value: rating === null ? loadingIcon : rating.count === 0 ? "—" : `${rating.average.toFixed(1)}`,
      comingSoon: rating !== null && rating.count === 0,
      onClick: () => navigate("/lawyer/reviews"),
    },
    { icon: Wallet, label: "Monthly Earnings", value: "—", comingSoon: true },
    {
      icon: Inbox,
      label: "Pending Requests",
      value: pendingCount === null ? loadingIcon : pendingCount,
      comingSoon: false,
      onClick: () => navigate("/lawyer/requests"),
    },
  ];

  const aiActions = [
    { icon: FileText, label: "Summarize Contract", enabled: true, onClick: () => setShowSummarize(true) },
    { icon: Scale, label: "Find Similar Cases", enabled: true, onClick: () => navigate("/case-law") },
    { icon: BookOpen, label: "Search Constitution", enabled: true, onClick: () => navigate("/constitution") },
    { icon: PenSquare, label: "Draft Demand Letter", enabled: true, onClick: () => setShowDemandLetter(true) },
    { icon: Lightbulb, label: "Generate Legal Opinion", enabled: true, onClick: () => navigate("/ask") },
  ];

  return (
    <main className="p-4 sm:p-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        Good day, Counsel {user?.name?.split(" ")[0]} 👋
      </h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Your practice dashboard.</p>

      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 mt-6">
        {statCards.map((card) => (
          <button
            key={card.label}
            onClick={card.onClick}
            disabled={!card.onClick}
            className={`text-left rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 ${
              card.onClick ? "hover:border-emerald-600 cursor-pointer" : "cursor-default"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <card.icon className="w-4 h-4 text-emerald-700" />
              {card.comingSoon && <ComingSoonBadge />}
            </div>
            <div
              className={`text-xl font-bold ${
                card.comingSoon ? "text-gray-300 dark:text-gray-700" : "text-gray-900 dark:text-gray-100"
              }`}
            >
              {card.value}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{card.label}</div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6 mt-6">
        <div className="flex flex-col gap-6 min-w-0">
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-sm flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-700" /> Upcoming Consultations
              </h2>
              <button
                onClick={() => navigate("/lawyer/calendar")}
                className="text-xs font-medium text-emerald-700 dark:text-emerald-400"
              >
                View Calendar
              </button>
            </div>
            {upcomingEvents === null ? (
              <div className="flex items-center gap-2 text-gray-400 text-sm py-8 justify-center">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading…
              </div>
            ) : upcomingEvents.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">
                Nothing scheduled yet. Accepted or confirmed consultation requests will show up here.
              </p>
            ) : (
              <div className="flex flex-col divide-y divide-gray-100 dark:divide-gray-800">
                {upcomingEvents.map((event) => (
                  <button
                    key={event._id}
                    onClick={() => navigate("/lawyer/calendar")}
                    className="flex items-center justify-between py-2.5 text-left hover:text-emerald-700"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-emerald-800 text-white flex items-center justify-center text-xs font-semibold shrink-0">
                        {event.clientId?.name?.[0]?.toUpperCase() || "?"}
                      </div>
                      <span className="text-sm truncate">{event.clientId?.name || "Unknown"}</span>
                    </div>
                    <span className="text-xs text-gray-400 shrink-0">
                      {new Date(event.startTime).toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-sm flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-emerald-700" /> Recent Messages
              </h2>
              <button
                onClick={() => navigate("/lawyer/messages")}
                className="text-xs font-medium text-emerald-700 dark:text-emerald-400"
              >
                View All
              </button>
            </div>
            {threads === null ? (
              <div className="flex items-center gap-2 text-gray-400 text-sm py-8 justify-center">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading…
              </div>
            ) : threads.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">
                No conversations yet. Messaging opens up once you have an accepted consultation.
              </p>
            ) : (
              <div className="flex flex-col divide-y divide-gray-100 dark:divide-gray-800">
                {threads.map((t) => (
                  <button
                    key={t.otherPartyId}
                    onClick={() => navigate("/lawyer/messages")}
                    className="flex items-center justify-between py-2.5 text-left hover:text-emerald-700"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className="w-7 h-7 rounded-full bg-emerald-800 text-white flex items-center justify-center text-xs font-semibold shrink-0">
                        {t.name?.[0]?.toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <span className="text-sm block truncate">{t.name}</span>
                        <span className="text-xs text-gray-400 block truncate">
                          {t.lastSenderIsMe ? "You: " : ""}
                          {t.lastMessage}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0 ml-2">
                      <span className="text-xs text-gray-400">{timeAgo(t.lastMessageAt)}</span>
                      {t.unreadCount > 0 && (
                        <span className="bg-emerald-800 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                          {t.unreadCount}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded-2xl border border-emerald-800 bg-emerald-950 text-white p-5">
            <div className="flex items-center gap-2 mb-1">
              <Bot className="w-5 h-5 text-amber-400" />
              <h2 className="font-semibold text-sm">Katiba AI Assistant</h2>
            </div>
            <p className="text-xs text-emerald-200 mb-4">
              This part is real - it uses the same RAG pipeline as the citizen-facing app.
            </p>
            <div className="flex flex-col gap-1.5">
              {aiActions.map((action) => (
                <button
                  key={action.label}
                  onClick={() => action.enabled && action.onClick?.()}
                  disabled={!action.enabled}
                  className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-sm text-left ${
                    action.enabled
                      ? "bg-emerald-900 hover:bg-emerald-800 text-white"
                      : "bg-emerald-900/40 text-emerald-300 cursor-not-allowed"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <action.icon className="w-4 h-4" />
                    {action.label}
                  </span>
                  {action.enabled ? (
                    <ArrowRight className="w-3.5 h-3.5" />
                  ) : (
                    <span className="text-[9px] uppercase tracking-wide text-emerald-400">Soon</span>
                  )}
                </button>
              ))}
            </div>
            <button
              onClick={() => navigate("/ask")}
              className="mt-3 w-full flex items-center justify-center gap-2 rounded-full bg-amber-400 text-emerald-950 font-semibold px-4 py-2.5 text-sm hover:bg-amber-300"
            >
              <Bot className="w-4 h-4" /> Ask Katiba AI
            </button>
          </div>
        </div>
      </div>

      {showDemandLetter && (
        <DemandLetterModal onClose={() => setShowDemandLetter(false)} senderName={user?.name} />
      )}
      {showSummarize && <SummarizeContractModal onClose={() => setShowSummarize(false)} />}
    </main>
  );
}