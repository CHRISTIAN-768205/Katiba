import { Router } from "express";
import Query from "../models/Query.js";

const router = Router();

const MAX_LIMIT = 20;

function clampLimit(raw, fallback = 5) {
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.min(Math.floor(n), MAX_LIMIT);
}

// GET /api/history/recent?userId=&limit= - recently viewed questions for a given user
// (or globally across anonymous /api/ask usage, if no userId given).
router.get("/recent", async (req, res) => {
  try {
    const { userId } = req.query;
    const limit = clampLimit(req.query.limit);
    const filter = userId ? { userId } : {};
    const items = await Query.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .select("question createdAt citedArticles");
    res.json(items);
  } catch (err) {
    console.error("[GET /api/history/recent]", err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/history/popular?limit= - most frequently asked questions across all users,
// for the "Popular Questions" panel. Groups case/whitespace-insensitively so
// "What are my rights?" and "what are my rights?" count as the same question,
// while still displaying one of the original (non-lowercased) phrasings.
router.get("/popular", async (req, res) => {
  try {
    const limit = clampLimit(req.query.limit);
    const items = await Query.aggregate([
      {
        $group: {
          _id: { $toLower: { $trim: { input: "$question" } } },
          question: { $first: "$question" },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: limit },
      { $project: { _id: 0, question: 1, count: 1 } },
    ]);
    res.json(items);
  } catch (err) {
    console.error("[GET /api/history/popular]", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;