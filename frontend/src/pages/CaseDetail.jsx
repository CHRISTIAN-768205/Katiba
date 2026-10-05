import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Briefcase, Mail, Loader2, Send } from "lucide-react";
import { getCase, updateCase, addCaseNote } from "../api/client.js";

const STATUS_STYLES = {
  open: "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400",
  in_progress: "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400",
  closed: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
};

export default function CaseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [addingNote, setAddingNote] = useState(false);

  function load() {
    setLoading(true);
    setError(null);
    getCase(id)
      .then(setCaseData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(load, [id]);

  async function handleStatusChange(status) {
    setUpdatingStatus(true);
    try {
      const updated = await updateCase(id, { status });
      setCaseData((prev) => ({ ...prev, status: updated.status, closedAt: updated.closedAt }));
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdatingStatus(false);
    }
  }

  async function handleAddNote() {
    if (!noteText.trim()) return;
    setAddingNote(true);
    try {
      const updated = await addCaseNote(id, noteText.trim());
      setCaseData(updated);
      setNoteText("");
    } catch (err) {
      setError(err.message);
    } finally {
      setAddingNote(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-gray-400 text-sm py-24 justify-center">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading…
      </div>
    );
  }
  if (error && !caseData) {
    return <p className="text-sm text-red-600 text-center py-24">{error}</p>;
  }

  return (
    <main className="max-w-2xl mx-auto p-4 sm:p-6">
      <button
        onClick={() => navigate("/lawyer/cases")}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-emerald-700 mb-4"
      >
        <ArrowLeft className="w-4 h-4" /> All Cases
      </button>

      <div className="flex items-start justify-between gap-3 mb-1">
        <div className="flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-emerald-700 shrink-0" />
          <h1 className="text-lg font-bold">{caseData.title}</h1>
        </div>
        <select
          value={caseData.status}
          onChange={(e) => handleStatusChange(e.target.value)}
          disabled={updatingStatus}
          className={`text-xs font-medium rounded-full px-3 py-1.5 border-none outline-none cursor-pointer ${STATUS_STYLES[caseData.status]}`}
        >
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{caseData.practiceArea}</p>
      <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300 mb-4">
        <span className="font-medium">{caseData.clientId?.name}</span>
        <span className="text-gray-300">·</span>
        <Mail className="w-3.5 h-3.5 text-gray-400" />
        <span className="text-xs text-gray-400">{caseData.clientId?.email}</span>
      </div>

      {caseData.description && (
        <p className="text-sm text-gray-700 dark:text-gray-300 rounded-xl border border-gray-200 dark:border-gray-800 p-4 mb-6">
          {caseData.description}
        </p>
      )}

      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

      <h2 className="text-sm font-semibold mb-3">Case Notes</h2>
      <div className="flex flex-col gap-2 mb-4">
        {caseData.notes?.length === 0 ? (
          <p className="text-sm text-gray-400">No notes yet. Add your first update below.</p>
        ) : (
          [...caseData.notes].reverse().map((note) => (
            <div key={note._id} className="rounded-xl border border-gray-200 dark:border-gray-800 p-3">
              <p className="text-sm text-gray-700 dark:text-gray-300">{note.text}</p>
              <p className="text-[11px] text-gray-400 mt-1">{new Date(note.createdAt).toLocaleString()}</p>
            </div>
          ))
        )}
      </div>

      <div className="flex items-start gap-2">
        <textarea
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          rows={2}
          placeholder="Add a note about progress on this case..."
          className="flex-1 rounded-lg border border-gray-200 dark:border-gray-800 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-600 resize-none"
        />
        <button
          onClick={handleAddNote}
          disabled={addingNote || !noteText.trim()}
          className="flex items-center justify-center rounded-full bg-emerald-800 text-white w-10 h-10 shrink-0 hover:bg-emerald-900 disabled:opacity-50"
        >
          {addingNote ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </div>
    </main>
  );
}