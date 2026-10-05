import { Router } from "express";
import Review from "../models/Review.js";
import ConsultationRequest from "../models/ConsultationRequest.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

// POST /api/reviews - a client reviews one of their own COMPLETED consultations.
router.post("/", requireAuth, async (req, res) => {
  try {
    const { requestId, rating, comment } = req.body;
    if (!requestId || !rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: "requestId and a rating from 1-5 are required" });
    }

    const request = await ConsultationRequest.findOne({ _id: requestId, clientId: req.user._id });
    if (!request) return res.status(404).json({ error: "Consultation not found" });
    if (request.status !== "completed") {
      return res.status(400).json({ error: "You can only review a completed consultation" });
    }

    const existing = await Review.findOne({ requestId });
    if (existing) return res.status(409).json({ error: "You've already reviewed this consultation" });

    const review = await Review.create({
      advocateId: request.advocateId,
      clientId: req.user._id,
      requestId,
      rating,
      comment: comment || "",
    });

    res.status(201).json(review);
  } catch (err) {
    // Race condition safety net: the unique index on requestId catches simultaneous double-submits
    // even if the findOne check above raced with another request.
    if (err.code === 11000) {
      return res.status(409).json({ error: "You've already reviewed this consultation" });
    }
    console.error("[POST /api/reviews]", err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/reviews/mine - the logged-in advocate's own received reviews, with a rating summary.
router.get("/mine", requireAuth, requireRole("advocate"), async (req, res) => {
  try {
    const reviews = await Review.find({ advocateId: req.user._id })
      .sort({ createdAt: -1 })
      .populate("clientId", "name");
    const average = reviews.length ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : null;
    res.json({ reviews, average, count: reviews.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/reviews/pending - the logged-in client's completed consultations that don't have a
// review yet, so the UI can prompt "leave a review" for exactly the right ones.
router.get("/pending", requireAuth, async (req, res) => {
  try {
    const completed = await ConsultationRequest.find({ clientId: req.user._id, status: "completed" }).populate(
      "advocateId",
      "name"
    );
    const reviewed = await Review.find({ clientId: req.user._id }).select("requestId");
    const reviewedIds = new Set(reviewed.map((r) => r.requestId.toString()));
    const pending = completed.filter((c) => !reviewedIds.has(c._id.toString()));
    res.json(pending);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/reviews?advocateId=... - public reviews for a specific advocate (e.g. for a future
// public advocate profile page). No auth required - reviews help prospective clients decide.
router.get("/", async (req, res) => {
  try {
    const { advocateId } = req.query;
    if (!advocateId) return res.status(400).json({ error: "advocateId is required" });

    const reviews = await Review.find({ advocateId }).sort({ createdAt: -1 }).populate("clientId", "name");
    const average = reviews.length ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : null;
    res.json({ reviews, average, count: reviews.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;