import { Router } from "express";
import {Conversation } from "../models/Conversation.js";
import { generateAnswer } from "../services/rag.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// Everything in this file requires a logged-in user - chat history is personal.
router.use(requireAuth);

function truncateTitle(text, max = 60) {
  return text.length > max ? text.slice(0, max).trim() + "…" : text;
}

// POST /api/chat - send a message. Pass { conversationId } to continue an existing thread,
// or omit it to start a new one.
router.post("/", async (req, res) => {
  try {
    const { message, language = "en", conversationId } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ error: "message is required" });
    }

    const result = await generateAnswer({ question: message, language });

    let conversation;
    if (conversationId) {
      conversation = await Conversation.findOne({ _id: conversationId, userId: req.user._id });
      if (!conversation) return res.status(404).json({ error: "Conversation not found" });
    } else {
      conversation = new Conversation({
        userId: req.user._id,
        title: truncateTitle(message),
        language: result.interpretation?.language || language,
      });
    }

    conversation.messages.push({ role: "user", text: message });
    conversation.messages.push({
      role: "assistant",
      text: result.answer,
      urgency: result.urgency,
      citedArticles: result.articles.map((a) => ({
        articleId: a.articleId,
        lawSource: a.lawSource,
        chapterNumber: a.chapterNumber,
        articleNumber: a.articleNumber,
        articleTitle: a.articleTitle,
      })),
    });

    await conversation.save();

    res.json({
      conversationId: conversation._id,
      answer: result.answer,
      urgency: result.urgency,
      articles: result.articles,
    });
  } catch (err) {
    console.error("[POST /api/chat]", err);
    res.status(500).json({ error: err.message || "Something went wrong sending that message." });
  }
});

// GET /api/chat - list this user's conversations (for a "chat history" sidebar), newest first.
router.get("/", async (req, res) => {
  try {
    const conversations = await Conversation.find({ userId: req.user._id })
      .sort({ updatedAt: -1 })
      .select("title language createdAt updatedAt");
    res.json(conversations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/chat/:id - full conversation with all messages.
router.get("/:id", async (req, res) => {
  try {
    const conversation = await Conversation.findOne({ _id: req.params.id, userId: req.user._id });
    if (!conversation) return res.status(404).json({ error: "Conversation not found" });
    res.json(conversation);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/chat/:id
router.delete("/:id", async (req, res) => {
  try {
    const result = await Conversation.deleteOne({ _id: req.params.id, userId: req.user._id });
    if (result.deletedCount === 0) return res.status(404).json({ error: "Conversation not found" });
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;