import { Router } from "express";
import { answerQuestion } from "../services/rag.js";
import { optionalAuth } from "../middleware/auth.js";

const router = Router();

// Anonymous by design (no requireAuth) - this is the public quick-ask on Home/Answer.
// optionalAuth still attaches req.user if a valid token happens to be present, so a
// logged-in user's questions get tied to their real account instead of a spoofable
// client-supplied userId. Logged-in users who want persistent multi-turn history should
// use /api/chat instead, which requires auth.
router.post("/", optionalAuth, async (req, res) => {
  try {
    const { question, userId } = req.body;
    const language = req.body.language === "sw" ? "sw" : "en";

    if (typeof question !== "string" || !question.trim()) {
      return res.status(400).json({ error: "question is required" });
    }

    const effectiveUserId = req.user?._id?.toString() || userId || null;

    const result = await answerQuestion({ question, language, userId: effectiveUserId });
    res.json(result);
  } catch (err) {
    console.error("[POST /api/ask]", err);
    res.status(500).json({ error: err.message || "Something went wrong answering that question." });
  }
});

export default router;