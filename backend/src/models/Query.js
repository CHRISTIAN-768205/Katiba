import mongoose from "mongoose";

const QuerySchema = new mongoose.Schema(
  {
    // Optional - wire to real auth later. Null = anonymous.
    userId: { type: String, default: null, index: true },
    question: { type: String, required: true },
    language: { type: String, enum: ["en", "sw"], default: "en" },
    answer: { type: String, required: true },
    citedArticles: [
      {
        articleId: { type: mongoose.Schema.Types.ObjectId, ref: "Article" },
        lawSource: { type: String },
        chapterNumber: Number,
        articleNumber: Number,
        articleTitle: String,
      },
    ],
    helpful: { type: Boolean, default: null },
  },
  { timestamps: true }
);

export default mongoose.model("Query", QuerySchema);