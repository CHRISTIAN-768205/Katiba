import { Router } from "express";
import Message from "../models/Message.js";
import ConsultationRequest from "../models/ConsultationRequest.js";
import User from "../models/User.js";
import { requireAuth } from "../middleware/auth.js";
import { sendNewMessageEmail } from "../services/emailService.js";

const router = Router();
router.use(requireAuth);

/** True if this advocate/client pair has at least one accepted/completed request between them. */
async function hasRealRelationship(advocateId, clientId) {
  const existing = await ConsultationRequest.findOne({
    advocateId,
    clientId,
    status: { $in: ["accepted", "completed"] },
  });
  return !!existing;
}

/** Resolves { advocateId, clientId } for the current user + the other party, based on the
 *  current user's role - so every route below works identically for either side of a thread. */
function resolvePair(req, otherUserId) {
  if (req.user.role === "advocate") {
    return { advocateId: req.user._id, clientId: otherUserId };
  }
  return { advocateId: otherUserId, clientId: req.user._id };
}

// POST /api/messages - send a message to a specific person (identified by recipientId).
router.post("/", async (req, res) => {
  try {
    const { recipientId, text } = req.body;
    if (!recipientId || !text || !text.trim()) {
      return res.status(400).json({ error: "recipientId and text are required" });
    }

    const { advocateId, clientId } = resolvePair(req, recipientId);

    if (!(await hasRealRelationship(advocateId, clientId))) {
      return res.status(403).json({
        error: "You can only message someone you have an accepted or completed consultation with.",
      });
    }

    const message = await Message.create({
      advocateId,
      clientId,
      senderId: req.user._id,
      text: text.trim(),
    });

    const recipient = await User.findById(recipientId);
    if (recipient) {
      sendNewMessageEmail({ recipient, sender: req.user, text: text.trim() }).catch(() => {});
    }

    res.status(201).json(message);
  } catch (err) {
    console.error("[POST /api/messages]", err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/messages/threads - every conversation the current user is part of, most recent first,
// with the last message preview and an unread count. Works identically for advocate or client.
router.get("/threads", async (req, res) => {
  try {
    const isAdvocate = req.user.role === "advocate";
    const matchField = isAdvocate ? "advocateId" : "clientId";
    const otherPartyField = isAdvocate ? "clientId" : "advocateId";

    const threads = await Message.aggregate([
      { $match: { [matchField]: req.user._id } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: `$${otherPartyField}`,
          lastMessage: { $first: "$text" },
          lastMessageAt: { $first: "$createdAt" },
          lastSenderId: { $first: "$senderId" },
          unreadCount: {
            $sum: {
              $cond: [{ $and: [{ $eq: ["$readAt", null] }, { $ne: ["$senderId", req.user._id] }] }, 1, 0],
            },
          },
        },
      },
      { $sort: { lastMessageAt: -1 } },
      { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "otherParty" } },
      { $unwind: "$otherParty" },
      {
        $project: {
          _id: 0,
          otherPartyId: "$_id",
          name: "$otherParty.name",
          email: "$otherParty.email",
          lastMessage: 1,
          lastMessageAt: 1,
          lastSenderIsMe: { $eq: ["$lastSenderId", req.user._id] },
          unreadCount: 1,
        },
      },
    ]);

    res.json(threads);
  } catch (err) {
    console.error("[GET /api/messages/threads]", err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/messages/thread/:otherUserId - full message history with one specific person.
router.get("/thread/:otherUserId", async (req, res) => {
  try {
    const { advocateId, clientId } = resolvePair(req, req.params.otherUserId);
    const messages = await Message.find({ advocateId, clientId })
      .sort({ createdAt: 1 })
      .populate("senderId", "name");
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/messages/thread/:otherUserId/read - mark every message the OTHER person sent me as read.
router.patch("/thread/:otherUserId/read", async (req, res) => {
  try {
    const { advocateId, clientId } = resolvePair(req, req.params.otherUserId);
    await Message.updateMany(
      { advocateId, clientId, senderId: { $ne: req.user._id }, readAt: null },
      { readAt: new Date() }
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;