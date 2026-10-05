import { Router } from "express";
import Case from "../models/Case.js";
import ConsultationRequest from "../models/ConsultationRequest.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

/** True if this client has at least one accepted/completed request with this advocate. */
async function isRealClient(advocateId, clientId) {
  const existing = await ConsultationRequest.findOne({
    advocateId,
    clientId,
    status: { $in: ["accepted", "completed"] },
  });
  return !!existing;
}

// POST /api/cases - advocate opens a case for a client they've actually consulted with.
router.post("/", requireRole("advocate"), async (req, res) => {
  try {
    const { clientId, title, practiceArea, description, originatingRequestId } = req.body;

    if (!clientId || !title || !title.trim()) {
      return res.status(400).json({ error: "clientId and title are required" });
    }

    // This is the integrity check that keeps "Cases" honest - you can't open a case for someone
    // you've never actually had an accepted consultation with, so this list never fills with
    // fabricated entries.
    if (!(await isRealClient(req.user._id, clientId))) {
      return res.status(403).json({
        error: "You can only open a case for a client whose consultation request you've accepted or completed.",
      });
    }

    const newCase = await Case.create({
      advocateId: req.user._id,
      clientId,
      title: title.trim(),
      practiceArea: practiceArea || "Other",
      description: description || "",
      originatingRequestId: originatingRequestId || null,
    });

    res.status(201).json(newCase);
  } catch (err) {
    console.error("[POST /api/cases]", err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/cases?status=open - the logged-in advocate's own cases.
router.get("/", requireRole("advocate"), async (req, res) => {
  try {
    const { status } = req.query;
    const filter = { advocateId: req.user._id };
    if (status) filter.status = status;
    const cases = await Case.find(filter)
      .sort({ updatedAt: -1 })
      .populate("clientId", "name email")
      .select("-notes"); // list view doesn't need the full notes timeline
    res.json(cases);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/cases/mine - a citizen's read-only view of their own cases (no internal notes exposed).
router.get("/mine", async (req, res) => {
  try {
    const cases = await Case.find({ clientId: req.user._id })
      .sort({ updatedAt: -1 })
      .populate("advocateId", "name email")
      .select("-notes");
    res.json(cases);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/cases/:id - full detail including notes. Advocate owner only.
router.get("/:id", requireRole("advocate"), async (req, res) => {
  try {
    const found = await Case.findOne({ _id: req.params.id, advocateId: req.user._id }).populate(
      "clientId",
      "name email"
    );
    if (!found) return res.status(404).json({ error: "Case not found" });
    res.json(found);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/cases/:id - update title/practiceArea/description/status.
router.patch("/:id", requireRole("advocate"), async (req, res) => {
  try {
    const found = await Case.findOne({ _id: req.params.id, advocateId: req.user._id });
    if (!found) return res.status(404).json({ error: "Case not found" });

    const { title, practiceArea, description, status } = req.body;
    if (title !== undefined) found.title = title;
    if (practiceArea !== undefined) found.practiceArea = practiceArea;
    if (description !== undefined) found.description = description;
    if (status !== undefined) {
      if (!["open", "in_progress", "closed"].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }
      found.status = status;
      found.closedAt = status === "closed" ? new Date() : null;
    }

    await found.save();
    res.json(found);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/cases/:id/notes - add a timestamped note to the case.
router.post("/:id/notes", requireRole("advocate"), async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) return res.status(400).json({ error: "text is required" });

    const found = await Case.findOne({ _id: req.params.id, advocateId: req.user._id });
    if (!found) return res.status(404).json({ error: "Case not found" });

    found.notes.push({ text: text.trim() });
    await found.save();
    res.status(201).json(found);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;