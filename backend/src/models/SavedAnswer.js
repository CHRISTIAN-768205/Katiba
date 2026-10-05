import mongoose from "mongoose";

const SavedAnswerSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Optional link back to the source record (chat message or Q&A id)
    // — null if we don't know it, or the source was deleted.
    sourceId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    // ---- Snapshot of the AI answer at the time of saving ----
    question: { type: String, required: true },
    answer: { type: String, required: true },
    language: { type: String, enum: ["en", "sw"], default: "en" },
    urgency: {
      type: String,
      enum: ["normal", "immediate"],
      default: "normal",
    },

    citedArticles: [
      {
        articleId: { type: mongoose.Schema.Types.ObjectId, ref: "Article" },
        lawSource: String,
        chapterNumber: Number,
        articleNumber: Number,
        articleTitle: String,
      },
    ],

    // ---- User's own fields ----
    note: { type: String, default: "", maxlength: 2000 },
    tags: [{ type: String, trim: true }],

    savedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

SavedAnswerSchema.index({ userId: 1, savedAt: -1 });

export default mongoose.models.SavedAnswer ||
  mongoose.model("SavedAnswer", SavedAnswerSchema);