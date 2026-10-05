import { Router } from "express";
import Article from "../models/Article.js";

const router = Router();

// --- Static routes first. Express matches top-to-bottom, and a dynamic route like
// /:chapterNumber/:articleNumber would otherwise swallow requests to e.g. /meta/chapters
// (matching chapterNumber="meta", articleNumber="chapters") before they ever reach it. ---

// GET /api/articles/meta/chapters?lawSource=... - distinct chapters, for "Explore by Chapter".
// Grouped by (lawSource, chapterNumber) together, not chapterNumber alone - otherwise a
// Penal Code chapter and a Constitution chapter that happen to share a number would merge.
router.get("/meta/chapters", async (req, res) => {
  try {
    const { lawSource } = req.query;
    const match = lawSource ? { lawSource } : {};
    const chapters = await Article.aggregate([
      { $match: match },
      {
        $group: {
          _id: { lawSource: "$lawSource", chapterNumber: "$chapterNumber" },
          title: { $first: "$chapterTitle" },
          articleCount: { $sum: 1 },
        },
      },
      { $sort: { "_id.lawSource": 1, "_id.chapterNumber": 1 } },
      {
        $project: {
          _id: 0,
          lawSource: "$_id.lawSource",
          chapterNumber: "$_id.chapterNumber",
          title: 1,
          articleCount: 1,
        },
      },
    ]);
    res.json(chapters);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/articles/meta/law-sources - distinct laws in the corpus (Constitution, Penal Code, ...),
// for the "Laws" (Acts & Statutes) browser page.
router.get("/meta/law-sources", async (req, res) => {
  try {
    const sources = await Article.aggregate([
      { $group: { _id: "$lawSource", articleCount: { $sum: 1 } } },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, lawSource: "$_id", articleCount: 1 } },
    ]);
    res.json(sources);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/articles/meta/tags - distinct topic tags across EVERY law source, with counts.
// This is what powers the Topics (Legal Topics A-Z) browser - unlike chapters/law-sources,
// tags deliberately cut across laws (e.g. "arrest" pulls together the Constitution, Penal Code,
// AND Criminal Procedure Code entries at once), so this does not group by lawSource.
router.get("/meta/tags", async (req, res) => {
  try {
    const tags = await Article.aggregate([
      { $unwind: "$tags" },
      { $group: { _id: "$tags", articleCount: { $sum: 1 } } },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, tag: "$_id", articleCount: 1 } },
    ]);
    res.json(tags);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/articles?chapter=4&tag=bill-of-rights&lawSource=Constitution+of+Kenya,+2010
router.get("/", async (req, res) => {
  try {
    const { chapter, tag, lawSource } = req.query;
    const filter = {};
    if (chapter) filter.chapterNumber = Number(chapter);
    if (tag) filter.tags = tag;
    if (lawSource) filter.lawSource = lawSource;

    const articles = await Article.find(filter)
      .select("-embedding")
      .sort({ lawSource: 1, chapterNumber: 1, articleNumber: 1 });
    res.json(articles);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Dynamic route last. ---

// GET /api/articles/:chapterNumber/:articleNumber?lawSource=...
// lawSource is optional but recommended - chapter+article numbers alone aren't unique across
// laws (e.g. Constitution Article 2 vs. a hypothetical Act with its own Section 2 under chapter 2).
router.get("/:chapterNumber/:articleNumber", async (req, res) => {
  try {
    const { chapterNumber, articleNumber } = req.params;
    const { lawSource } = req.query;

    const filter = {
      chapterNumber: Number(chapterNumber),
      articleNumber: Number(articleNumber),
    };
    if (lawSource) filter.lawSource = lawSource;

    const article = await Article.findOne(filter).select("-embedding");
    if (!article) return res.status(404).json({ error: "Article not found" });
    res.json(article);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;