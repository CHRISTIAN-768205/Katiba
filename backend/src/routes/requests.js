import { Router } from "express";
import ConsultationRequest from "../models/ConsultationRequest.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { hasConflict, upsertCalendarEvent, cancelCalendarEvent, completeCalendarEvent } from "../services/schedulingService.js";
import {
  sendRequestAcceptedEmail,
  sendRequestRejectedEmail,
  sendRescheduleProposedEmail,
  sendRescheduleConfirmedEmail,
  sendRescheduleDeclinedEmail,
} from "../services/emailService.js";

const router = Router();
router.use(requireAuth);

async function loadOwnedByAdvocate(req, res) {
  const request = await ConsultationRequest.findOne({ _id: req.params.id, advocateId: req.user._id }).populate(
    "clientId advocateId"
  );
  if (!request) {
    res.status(404).json({ error: "Request not found" });
    return null;
  }
  return request;
}

router.get("/received", requireRole("advocate"), async (req, res) => {
  try {
    const { status } = req.query;
    const filter = { advocateId: req.user._id };
    if (status) filter.status = status;
    const requests = await ConsultationRequest.find(filter)
      .sort({ createdAt: -1 })
      .populate("clientId", "name email");
    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/sent", async (req, res) => {
  try {
    const requests = await ConsultationRequest.find({ clientId: req.user._id })
      .sort({ createdAt: -1 })
      .populate("advocateId", "name email");
    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/clients", requireRole("advocate"), async (req, res) => {
  try {
    const clients = await ConsultationRequest.aggregate([
      { $match: { advocateId: req.user._id, status: { $in: ["accepted", "completed"] } } },
      {
        $group: {
          _id: "$clientId",
          acceptedRequestCount: { $sum: 1 },
          firstAcceptedAt: { $min: "$updatedAt" },
          lastAcceptedAt: { $max: "$updatedAt" },
        },
      },
      { $sort: { lastAcceptedAt: -1 } },
      { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "client" } },
      { $unwind: "$client" },
      {
        $project: {
          _id: 0,
          clientId: "$_id",
          name: "$client.name",
          email: "$client.email",
          acceptedRequestCount: 1,
          firstAcceptedAt: 1,
          lastAcceptedAt: 1,
        },
      },
    ]);
    res.json(clients);
  } catch (err) {
    console.error("[GET /api/requests/clients]", err);
    res.status(500).json({ error: err.message });
  }
});

router.patch("/:id/accept", requireRole("advocate"), async (req, res) => {
  try {
    const request = await loadOwnedByAdvocate(req, res);
    if (!request) return;
    if (request.status !== "pending") {
      return res.status(400).json({ error: `Can't accept a request with status "${request.status}"` });
    }

    const endTime = new Date(request.requestedDate.getTime() + request.durationMinutes * 60 * 1000);
    if (await hasConflict(req.user._id, request.requestedDate, endTime, request._id)) {
      return res.status(409).json({
        error: "You already have another consultation booked at that time. Propose a reschedule instead.",
      });
    }

    request.status = "accepted";
    request.confirmedDate = request.requestedDate;
    request.locationOrLink = req.body.locationOrLink || request.locationOrLink;
    request.firstRespondedAt = request.firstRespondedAt || new Date();
    await request.save();
    await upsertCalendarEvent(request);

    const { sent } = await sendRequestAcceptedEmail({ client: request.clientId, advocate: request.advocateId, request });
    res.json({ request, emailSent: sent });
  } catch (err) {
    console.error("[PATCH /api/requests/:id/accept]", err);
    res.status(500).json({ error: err.message });
  }
});

router.patch("/:id/reject", requireRole("advocate"), async (req, res) => {
  try {
    const request = await loadOwnedByAdvocate(req, res);
    if (!request) return;
    if (request.status !== "pending") {
      return res.status(400).json({ error: `Can't reject a request with status "${request.status}"` });
    }

    request.status = "rejected";
    request.rejectionReason = req.body.rejectionReason || null;
    request.firstRespondedAt = request.firstRespondedAt || new Date();
    await request.save();

    const { sent } = await sendRequestRejectedEmail({ client: request.clientId, advocate: request.advocateId, request });
    res.json({ request, emailSent: sent });
  } catch (err) {
    console.error("[PATCH /api/requests/:id/reject]", err);
    res.status(500).json({ error: err.message });
  }
});

router.patch("/:id/reschedule", requireRole("advocate"), async (req, res) => {
  try {
    const { proposedDate, rescheduleNote } = req.body;
    if (!proposedDate || isNaN(Date.parse(proposedDate))) {
      return res.status(400).json({ error: "proposedDate is required and must be a valid date/time" });
    }
    if (new Date(proposedDate) <= new Date()) {
      return res.status(400).json({ error: "proposedDate must be in the future" });
    }

    const request = await loadOwnedByAdvocate(req, res);
    if (!request) return;
    if (request.status !== "pending") {
      return res.status(400).json({ error: `Can't propose a reschedule for a request with status "${request.status}"` });
    }

    request.status = "reschedule_proposed";
    request.proposedDate = new Date(proposedDate);
    request.rescheduleNote = rescheduleNote || null;
    request.firstRespondedAt = request.firstRespondedAt || new Date();
    await request.save();

    const { sent } = await sendRescheduleProposedEmail({ client: request.clientId, advocate: request.advocateId, request });
    res.json({ request, emailSent: sent });
  } catch (err) {
    console.error("[PATCH /api/requests/:id/reschedule]", err);
    res.status(500).json({ error: err.message });
  }
});

router.patch("/:id/confirm-reschedule", async (req, res) => {
  try {
    const request = await ConsultationRequest.findOne({ _id: req.params.id, clientId: req.user._id }).populate(
      "clientId advocateId"
    );
    if (!request) return res.status(404).json({ error: "Request not found" });
    if (request.status !== "reschedule_proposed") {
      return res.status(400).json({ error: `Can't confirm a request with status "${request.status}"` });
    }

    const endTime = new Date(request.proposedDate.getTime() + request.durationMinutes * 60 * 1000);
    if (await hasConflict(request.advocateId._id, request.proposedDate, endTime, request._id)) {
      return res.status(409).json({
        error: "That slot is no longer available - the advocate has since been booked elsewhere. Please try a different time.",
      });
    }

    request.status = "accepted";
    request.confirmedDate = request.proposedDate;
    await request.save();
    await upsertCalendarEvent(request);

    const { sent } = await sendRescheduleConfirmedEmail({ advocate: request.advocateId, client: request.clientId, request });
    res.json({ request, emailSent: sent });
  } catch (err) {
    console.error("[PATCH /api/requests/:id/confirm-reschedule]", err);
    res.status(500).json({ error: err.message });
  }
});

router.patch("/:id/decline-reschedule", async (req, res) => {
  try {
    const request = await ConsultationRequest.findOne({ _id: req.params.id, clientId: req.user._id }).populate(
      "clientId advocateId"
    );
    if (!request) return res.status(404).json({ error: "Request not found" });
    if (request.status !== "reschedule_proposed") {
      return res.status(400).json({ error: `Can't decline a request with status "${request.status}"` });
    }

    request.status = "rejected";
    request.rejectionReason = "Client declined the proposed reschedule.";
    await request.save();

    const { sent } = await sendRescheduleDeclinedEmail({ advocate: request.advocateId, client: request.clientId, request });
    res.json({ request, emailSent: sent });
  } catch (err) {
    console.error("[PATCH /api/requests/:id/decline-reschedule]", err);
    res.status(500).json({ error: err.message });
  }
});

router.patch("/:id/complete", requireRole("advocate"), async (req, res) => {
  try {
    const request = await loadOwnedByAdvocate(req, res);
    if (!request) return;
    if (request.status !== "accepted") {
      return res.status(400).json({ error: `Can't complete a request with status "${request.status}"` });
    }

    request.status = "completed";
    await request.save();
    await completeCalendarEvent(request._id);
    res.json({ request });
  } catch (err) {
    console.error("[PATCH /api/requests/:id/complete]", err);
    res.status(500).json({ error: err.message });
  }
});

router.patch("/:id/cancel", async (req, res) => {
  try {
    const request = await ConsultationRequest.findOne({
      _id: req.params.id,
      $or: [{ clientId: req.user._id }, { advocateId: req.user._id }],
    });
    if (!request) return res.status(404).json({ error: "Request not found" });
    if (request.status !== "accepted") {
      return res.status(400).json({ error: `Can't cancel a request with status "${request.status}"` });
    }

    request.status = "cancelled";
    await request.save();
    await cancelCalendarEvent(request._id);
    res.json({ request });
  } catch (err) {
    console.error("[PATCH /api/requests/:id/cancel]", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;