import { Router } from "express";
import ConsultationRequest from "../models/ConsultationRequest.js";
import CaseModel from "../models/Case.js";
import Review from "../models/Review.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth, requireRole("advocate"));

router.get("/me", async (req, res) => {
  try {
    const advocateId = req.user._id;

    // Consultation volume, last 12 weeks.
    const twelveWeeksAgo = new Date();
    twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 12 * 7);
    const volumeByWeek = await ConsultationRequest.aggregate([
      { $match: { advocateId, createdAt: { $gte: twelveWeeksAgo } } },
      { $group: { _id: { $dateTrunc: { date: "$createdAt", unit: "week" } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, weekStart: "$_id", count: 1 } },
    ]);

    // Acceptance rate - among requests that reached a final outcome (excludes still-pending or
    // awaiting the client's reply to a reschedule, since those haven't been decided yet).
    const decided = await ConsultationRequest.aggregate([
      { $match: { advocateId, status: { $in: ["accepted", "completed", "rejected", "cancelled"] } } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);
    const counts = Object.fromEntries(decided.map((d) => [d._id, d.count]));
    const acceptedLike = (counts.accepted || 0) + (counts.completed || 0) + (counts.cancelled || 0);
    const totalDecided = acceptedLike + (counts.rejected || 0);
    const acceptanceRate = totalDecided > 0 ? (acceptedLike / totalDecided) * 100 : null;

    // Average response time: how long it takes the advocate to first act on a request (accept,
    // reject, or propose a reschedule). Uses `firstRespondedAt`, which is captured exactly once
    // at that first action and never touched again - so it stays accurate even for requests that
    // later go through a reschedule round-trip, unlike `updatedAt` which keeps moving forward.
    const responded = await ConsultationRequest.find({ advocateId, firstRespondedAt: { $ne: null } }).select(
      "createdAt firstRespondedAt"
    );
    const avgResponseTimeHours =
      responded.length > 0
        ? responded.reduce((sum, r) => sum + (r.firstRespondedAt - r.createdAt), 0) / responded.length / 1000 / 60 / 60
        : null;

    // Practice area breakdown - real, from actual opened cases.
    const practiceAreaBreakdown = await CaseModel.aggregate([
      { $match: { advocateId } },
      { $group: { _id: "$practiceArea", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $project: { _id: 0, practiceArea: "$_id", count: 1 } },
    ]);

    const totalRequests = await ConsultationRequest.countDocuments({ advocateId });
    const totalCases = await CaseModel.countDocuments({ advocateId });
    const reviews = await Review.find({ advocateId }).select("rating");
    const avgRating = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : null;

    res.json({
      volumeByWeek,
      acceptanceRate,
      avgResponseTimeHours,
      practiceAreaBreakdown,
      totalRequests,
      totalCases,
      avgRating,
      reviewCount: reviews.length,
    });
  } catch (err) {
    console.error("[GET /api/analytics/me]", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;