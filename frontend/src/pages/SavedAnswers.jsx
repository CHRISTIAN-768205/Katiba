import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bookmark,
  Trash2,
  Pencil,
  Loader2,
  ChevronDown,
  ExternalLink,
} from "lucide-react";
import { getSavedAnswers, deleteSavedAnswer, updateSavedAnswer } from "../api/client";

export default function SavedAnswers() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState({}); // { [id]: true }
  const [editingNote, setEditingNote] = useState(null); // id being edited
  const [noteDraft, setNoteDraft] = useState("");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const { items } = await getSavedAnswers(1, 100);
      setItems(items);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Delete this saved answer? This can't be undone.")) return;
    try {
      await deleteSavedAnswer(id);
      setItems((prev) => prev.filter((i) => i._id !== id));
    } catch (err) {
      alert(err.message);
    }
  }

  function startEditNote(item) {
    setEditingNote(item._id);
    setNoteDraft(item.note || "");
  }

  async function saveNote(id) {
    try {
      const updated = await updateSavedAnswer(id, { note: noteDraft });
      setItems((prev) => prev.map((i) => (i._id === id ? updated : i)));
      setEditingNote(null);
    } catch (err) {
      alert(err.message);
    }
  }

  if (loading) {
    return (
      <main className="max-w-3xl mx-auto p-6">
        <div className="flex items-center gap-2 text-gray-400 text-sm py-12 justify-center">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading saved answers…
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="max-w-3xl mx-auto p-6">
        <p className="text-sm text-red-600 text-center py-12">{error}</p>
      </main>
    );
  }

  return (
    <main className="max-w-3xl mx-auto p-4 sm:p-6">
      <div className="flex items-center gap-2 mb-1">
        <Bookmark className="w-5 h-5 text-emerald-700" />
        <h1 className="text-xl font-bold">Saved Answers</h1>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        {items.length === 0
          ? "Answers you save from the AI will appear here."
          : `${items.length} saved answer${items.length === 1 ? "" : "s"}`}
      </p>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 dark:border-gray-800 p-10 text-center">
          <Bookmark className="w-8 h-8 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Nothing saved yet. Ask Katiba AI a question and tap the bookmark icon.
          </p>
          <Link
            to="/ask"
            className="inline-block rounded-full bg-emerald-800 text-white px-5 py-2.5 text-sm font-medium hover:bg-emerald-900"
          >
            Ask Katiba AI
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((item) => {
            const isOpen = expanded[item._id];
            return (
              <div
                key={item._id}
                className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden"
              >
                <button
                  onClick={() =>
                    setExpanded((prev) => ({ ...prev, [item._id]: !prev[item._id] }))
                  }
                  className="w-full text-left p-4 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-gray-400 mb-1">
                        {new Date(item.savedAt).toLocaleDateString("en-KE", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                        {item.urgency === "immediate" && (
                          <span className="ml-2 text-[10px] uppercase font-semibold text-red-600 bg-red-50 dark:bg-red-950/40 px-1.5 py-0.5 rounded">
                            Urgent
                          </span>
                        )}
                      </div>
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {item.question}
                      </div>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 shrink-0 mt-1 text-gray-400 transition-transform ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 border-t border-gray-100 dark:border-gray-800">
                    <div className="pt-3 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                      {item.answer}
                    </div>

                    {item.citedArticles?.length > 0 && (
                      <div className="mt-3">
                        <div className="text-xs font-medium text-gray-500 mb-1">
                          Cited
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {item.citedArticles.map((c, i) => (
                            <Link
                              key={i}
                              to={`/constitution/${c.chapterNumber}/${c.articleNumber}?lawSource=${encodeURIComponent(c.lawSource || "")}`}
                              className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100"
                            >
                              Article {c.articleNumber}
                              <ExternalLink className="w-2.5 h-2.5" />
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Note editor */}
                    <div className="mt-4">
                      {editingNote === item._id ? (
                        <div>
                          <textarea
                            value={noteDraft}
                            onChange={(e) => setNoteDraft(e.target.value)}
                            rows={2}
                            maxLength={2000}
                            placeholder="Your note…"
                            className="w-full rounded-lg border border-gray-200 dark:border-gray-800 bg-transparent px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-emerald-600"
                          />
                          <div className="flex gap-2 mt-1">
                            <button
                              onClick={() => saveNote(item._id)}
                              className="text-xs font-medium text-emerald-700 dark:text-emerald-400"
                            >
                              Save note
                            </button>
                            <button
                              onClick={() => setEditingNote(null)}
                              className="text-xs text-gray-400"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => startEditNote(item)}
                          className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 inline-flex items-center gap-1"
                        >
                          <Pencil className="w-3 h-3" />
                          {item.note ? item.note : "Add a note"}
                        </button>
                      )}
                    </div>

                    <div className="mt-3 flex justify-end">
                      <button
                        onClick={() => handleDelete(item._id)}
                        className="text-xs text-red-600 hover:text-red-700 inline-flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" /> Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}