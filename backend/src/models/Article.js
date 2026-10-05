import mongoose from "mongoose";

const ArticleSchema = new mongoose.Schema(
  {
    // e.g. "Constitution of Kenya, 2010", "Penal Code (Cap 63)", "Victim Protection Act No. 17 of 2014"
    lawSource: { type: String, required: true, default: "Constitution of Kenya, 2010", index: true },
    // "constitution" | "act" | "case" | "guide" - loose classification, mainly for future filtering.
    type: { type: String, default: "constitution" },
    // For the Constitution this is the Chapter number; for an Act, use a Part/Chapter number if it has one, else 0.
    chapterNumber: { type: Number, required: true, index: true },
    chapterTitle: { type: String, required: true },
    // Some laws (like the Constitution) subdivide a Chapter into numbered Parts.
    partNumber: { type: Number, default: null },
    partTitle: { type: String, default: null },
    // For the Constitution this is the Article number; for an Act, the Section number.
    articleNumber: { type: Number, required: true, index: true },
    articleTitle: { type: String, required: true },

    // The exact legal text for this article/section, unedited. For richly-annotated entries this
    // is a copy of `officialText`, kept so every existing code path that reads `.text` generically
    // (search results, embeddings fallback, simple display) keeps working without special-casing.
    text: { type: String, required: true },
    officialText: { type: String, default: null },

    // Rich, human-curated annotations - optional, so simpler seed files (Penal Code, etc.) keep
    // working exactly as before with just the fields above.
    plainLanguage: { type: String, default: null },
    commonQuestions: [{ type: String }],
    realLifeExamples: [{ type: String }],
    legalConcepts: [{ type: String }],
    // e.g. { "Article 175": "Sets out the principles that guide devolved government..." }
    crossReferenceExplanations: { type: mongoose.Schema.Types.Mixed, default: null },
    relevantLegislation: [{ type: String }],
    relevantCaseLaw: [{ type: String }],
    swahiliTranslation: { type: String, default: null },
    searchSynonyms: [{ type: String }],
    disclaimer: { type: String, default: null },

    // Free-text topic tags used for quick-filter browsing (Bill of Rights, Land, Devolution, etc.)
    tags: [{ type: String, index: true }],
    // Embedding vector generated at seed time (officialText + plainLanguage + synonyms when
    // available, else articleTitle + text). Dimension depends on the embedding model
    // (voyage-3 = 1024 dims).
    embedding: { type: [Number], required: true },
    sourceUrl: { type: String, default: "https://new.kenyalaw.org/akn/ke/act/2010/constitution" },
  },
  { timestamps: true }
);

ArticleSchema.index({ lawSource: 1, chapterNumber: 1, articleNumber: 1 }, { unique: true });

export default mongoose.model("Article", ArticleSchema);