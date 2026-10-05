import { Router } from "express";
import User from "../models/User.js";
import ConsultationRequest from "../models/ConsultationRequest.js";
import Review from "../models/Review.js";
import { sendConsultationRequestEmail } from "../services/emailService.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const advocates = await User.find({ role: "advocate" })
      .select("name email advocateVerified createdAt bio practiceAreas yearsOfExperience")
      .sort({ createdAt: -1 });
    res.json(advocates);
  } catch (err) {
    console.error("[GET /api/advocates]", err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/advocates/:id - a single advocate's public profile, combined with their review stats.
router.get("/:id", async (req, res) => {
  try {
    const advocate = await User.findOne({ _id: req.params.id, role: "advocate" }).select(
      "name email advocateVerified createdAt bio practiceAreas yearsOfExperience"
    );
    if (!advocate) return res.status(404).json({ error: "Advocate not found" });

    const reviews = await Review.find({ advocateId: advocate._id }).sort({ createdAt: -1 }).populate(
      "clientId",
      "name"
    );
    const average = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : null;

    res.json({ advocate, reviews, averageRating: average, reviewCount: reviews.length });
  } catch (err) {
    console.error("[GET /api/advocates/:id]", err);
    res.status(500).json({ error: err.message });
  }
});

router.post("/:id/requests", requireAuth, async (req, res) => {
  try {
    const { message, requestedDate, durationMinutes, consultationType } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: "message is required" });
    }
    if (!requestedDate || isNaN(Date.parse(requestedDate))) {
      return res.status(400).json({ error: "requestedDate is required and must be a valid date/time" });
    }
    const parsedDate = new Date(requestedDate);
    if (parsedDate <= new Date()) {
      return res.status(400).json({ error: "requestedDate must be in the future" });
    }
    if (consultationType && !["virtual", "physical"].includes(consultationType)) {
      return res.status(400).json({ error: "consultationType must be 'virtual' or 'physical'" });
    }

    const advocate = await User.findOne({ _id: req.params.id, role: "advocate" });
    if (!advocate) return res.status(404).json({ error: "Advocate not found" });
    if (advocate._id.equals(req.user._id)) {
      return res.status(400).json({ error: "You can't send a request to yourself" });
    }

    const request = await ConsultationRequest.create({
      clientId: req.user._id,
      advocateId: advocate._id,
      message: message.trim(),
      requestedDate: parsedDate,
      durationMinutes: durationMinutes && durationMinutes >= 15 && durationMinutes <= 240 ? durationMinutes : 30,
      consultationType: consultationType || "virtual",
    });

    const { sent } = await sendConsultationRequestEmail({
      advocate,
      client: req.user,
      message,
      requestedDate: parsedDate,
    });

    res.status(201).json({ request, emailSent: sent });
  } catch (err) {
    console.error("[POST /api/advocates/:id/requests]", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;