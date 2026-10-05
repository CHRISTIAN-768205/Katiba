import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Briefcase, Loader2, Plus, X, ChevronRight } from "lucide-react";
import { getMyCases, getMyClients, createCase } from "../api/client.js";

const TABS = [
  { key: "open", label: "Open" },
  { key: "in_progress", label: "In Progress" },
  { key: "closed", label: "Closed" },
];

const PRACTICE_AREAS = [
  "Land Law",
  "Employment Law",
  "Family Law",
  "Criminal Law",
  "Corporate/Business Law",
  "Consumer Law",
  "Constitutional Law",
  "Other",
];

const STATUS_STYLES = {
  open: "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400",
  in_progress: "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400",
  closed: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
};

export default function Cases() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("open");
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showNewCase, setShowNewCase] = useState(false);
  const [clients, setClients] = useState([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [clientId, setClientId] = useState("");
  const [title, setTitle] = useState("");
  const [practiceArea, setPracticeArea] = useState("Other");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState(null);

  function load() {
    setLoading(true);
    setError(null);
    getMyCases(tab)
      .then(setCases)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(load, [tab]);

  function openNewCase() {
    setShowNewCase(true);
    setTitle("");
    setPracticeArea("Other");
    setDescription("");
    setClientId("");
    setCreateError(null);
    setLoadingClients(true);
    getMyClients()
      .then(setClients)
      .catch((err) => setCreateError(err.message))
      .finally(() => setLoadingClients(false));
  }

  async function handleCreate() {
    if (!clientId || !title.trim()) return;
    setCreating(true);
    setCreateError(null);
    try {
      await createCase({ clientId, title: title.trim(), practiceArea, description });
      setShowNewCase(false);
      if (tab === "open") load();
    } catch (err) {
      setCreateError(err.message);
    } finally {
      setCreating(false);
    }
  }

  return (
    <main className="max-w-3xl mx-auto p-4 sm:p-6">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-emerald-700" />
          <h1 className="text-xl font-bold">Cases</h1>
        </div>
        <button
          onClick={openNewCase}
          className="flex items-center gap-1.5 rounded-full bg-emerald-800 text-white px-3.5 py-1.5 text-sm font-medium hover:bg-emerald-900"
        >
          <Plus className="w-4 h-4" /> New Case
        </button>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
        Only clients whose consultation you've accepted or completed can have a case opened for them.
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
      ) : cases.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-12">No {tab.replace("_", " ")} cases.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {cases.map((c) => (
            <button
              key={c._id}
              onClick={() => navigate(`/lawyer/cases/${c._id}`)}
              className="flex items-start gap-3 rounded-xl border border-gray-200 dark:border-gray-800 p-4 text-left hover:border-emerald-600 hover:shadow-sm transition"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm truncate">{c.title}</span>
                  <span className={`text-[10px] uppercase tracking-wide rounded-full px-2 py-0.5 shrink-0 ${STATUS_STYLES[c.status]}`}>
                    {c.status.replace("_", " ")}
                  </span>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {c.practiceArea} · {c.clientId?.name}
                </div>
                {c.description && (
                  <p className="text-xs text-gray-400 mt-1 line-clamp-1">{c.description}</p>
                )}
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 shrink-0 mt-1" />
            </button>
          ))}
        </div>
      )}

      {showNewCase && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-sm">Open a new case</h2>
              <button onClick={() => setShowNewCase(false)} className="text-gray-400 hover:text-gray-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Client</label>
            {loadingClients ? (
              <div className="flex items-center gap-2 text-gray-400 text-sm py-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading clients…
              </div>
            ) : clients.length === 0 ? (
              <p className="text-xs text-gray-400 mt-1 mb-3">
                No clients yet - accept a consultation request first.
              </p>
            ) : (
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full mt-1 mb-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-600"
              >
                <option value="">Select a client…</option>
                {clients.map((c) => (
                  <option key={c.clientId} value={c.clientId}>
                    {c.name} ({c.email})
                  </option>
                ))}
              </select>
            )}

            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Case title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Land dispute - Kiambu"
              className="w-full mt-1 mb-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-600"
            />

            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Practice area</label>
            <select
              value={practiceArea}
              onChange={(e) => setPracticeArea(e.target.value)}
              className="w-full mt-1 mb-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-600"
            >
              {PRACTICE_AREAS.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>

            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full mt-1 mb-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-600 resize-none"
            />

            {createError && <p className="text-sm text-red-600 mb-2">{createError}</p>}
            <button
              onClick={handleCreate}
              disabled={creating || !clientId || !title.trim()}
              className="w-full flex items-center justify-center gap-2 rounded-full bg-emerald-800 text-white px-4 py-2.5 text-sm font-medium hover:bg-emerald-900 disabled:opacity-50"
            >
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Case"}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
