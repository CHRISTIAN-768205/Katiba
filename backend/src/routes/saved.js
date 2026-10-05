import { Router } from "express";
import SavedAnswer from "../models/SavedAnswer.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// Everything here requires a logged-in user
router.use(requireAuth);

// ============================================================
// POST /api/saved — save an AI answer
// ============================================================
router.post("/", async (req, res) => {
  try {
    const {
      sourceId,
      question,
      answer,
      language = "en",
      urgency = "normal",
      citedArticles = [],
      note = "",
    } = req.body;

    if (!question || !answer) {
      return res.status(400).json({ error: "question and answer are required" });
    }

    const saved = await SavedAnswer.create({
      userId: req.user._id,
      sourceId: sourceId || null,
      question,
      answer,
      language,
      urgency,
      citedArticles,
      note,
    });

    res.status(201).json({ saved });
  } catch (err) {
    console.error("[POST /api/saved]", err);
    res.status(500).json({ error: "Could not save answer" });
  }
});

// ============================================================
// GET /api/saved — list saved answers (paginated)
// ============================================================
router.get("/", async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const page = Math.max(Number(req.query.page) || 1, 1);
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      SavedAnswer.find({ userId: req.user._id })
        .sort({ savedAt: -1 })
        .skip(skip)
        .limit(limit),
      SavedAnswer.countDocuments({ userId: req.user._id }),
    ]);

    res.json({
      items,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("[GET /api/saved]", err);
    res.status(500).json({ error: "Could not load saved answers" });
  }
});

// ============================================================
// GET /api/saved/:id — fetch one
// ============================================================
router.get("/:id", async (req, res) => {
  try {
    const saved = await SavedAnswer.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });
    if (!saved) return res.status(404).json({ error: "Not found" });
    res.json({ saved });
  } catch (err) {
    console.error("[GET /api/saved/:id]", err);
    res.status(500).json({ error: "Could not load" });
  }
});

// ============================================================
// PATCH /api/saved/:id — update note or tags
// ============================================================
router.patch("/:id", async (req, res) => {
  try {
    const { note, tags } = req.body;
    const saved = await SavedAnswer.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });
    if (!saved) return res.status(404).json({ error: "Not found" });

    if (note !== undefined) {
      if (note.length > 2000) {
        return res.status(400).json({ error: "note must be 2000 characters or fewer" });
      }
      saved.note = note;
    }
    if (tags !== undefined) {
      if (!Array.isArray(tags)) {
        return res.status(400).json({ error: "tags must be an array" });
      }
      saved.tags = tags;
    }

    await saved.save();
    res.json({ saved });
  } catch (err) {
    console.error("[PATCH /api/saved/:id]", err);
    res.status(500).json({ error: "Could not update" });
  }
});

// ============================================================
// DELETE /api/saved/:id — remove one
// ============================================================
router.delete("/:id", async (req, res) => {
  try {
    const result = await SavedAnswer.deleteOne({
      _id: req.params.id,
      userId: req.user._id,
    });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Not found" });
    }
    res.status(204).end();
  } catch (err) {
    console.error("[DELETE /api/saved/:id]", err);
    res.status(500).json({ error: "Could not delete" });
  }
});

export default router;