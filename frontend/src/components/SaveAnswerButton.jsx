// frontend/src/components/SaveAnswerButton.jsx
import { useState } from "react";
import { Bookmark, BookmarkCheck, Loader2 } from "lucide-react";
import { saveAnswer } from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function SaveAnswerButton({ sourceId, question, answer, language, urgency, citedArticles }) {
  const { user } = useAuth();
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!user) {
      alert("Please sign in to save answers.");
      return;
    }
    if (saved || saving) return;

    setSaving(true);
    try {
      await saveAnswer({
        sourceId,
        question,
        answer,
        language,
        urgency,
        citedArticles,
      });
      setSaved(true);
    } catch (err) {
      alert(err.message || "Could not save.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <button
      onClick={handleSave}
      disabled={saved || saving}
      className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-emerald-700 dark:hover:text-emerald-400 disabled:opacity-60"
      title={saved ? "Saved" : "Save this answer"}
    >
      {saving ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : saved ? (
        <BookmarkCheck className="w-3.5 h-3.5 text-emerald-700" />
      ) : (
        <Bookmark className="w-3.5 h-3.5" />
      )}
      {saved ? "Saved" : "Save"}
    </button>
  );
}