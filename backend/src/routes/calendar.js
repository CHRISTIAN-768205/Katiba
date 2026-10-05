import { Router } from "express";
import CalendarEvent from "../models/CalendarEvent.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

// GET /api/calendar/me?status=upcoming - the logged-in advocate's calendar events.
router.get("/me", requireRole("advocate"), async (req, res) => {
  try {
    const { status } = req.query;
    const filter = { advocateId: req.user._id };
    if (status) filter.status = status;
    const events = await CalendarEvent.find(filter)
      .sort({ startTime: status === "completed" || status === "cancelled" ? -1 : 1 })
      .populate("clientId", "name email");
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;