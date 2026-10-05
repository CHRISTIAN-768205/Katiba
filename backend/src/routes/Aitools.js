import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { summarizeContract, draftDemandLetter, generateLegalOpinion } from "../services/advocateAiTools.js";

const router = Router();
router.use(requireAuth, requireRole("advocate"));

const MAX_CONTRACT_LENGTH = 20000; // characters - generous for a pasted contract, keeps the Claude call bounded

router.post("/summarize-contract", async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) return res.status(400).json({ error: "text is required" });
    if (text.length > MAX_CONTRACT_LENGTH) {
      return res
        .status(400)
        .json({ error: `Please paste up to ${MAX_CONTRACT_LENGTH.toLocaleString()} characters at a time.` });
    }
    const summary = await summarizeContract(text);
    res.json({ summary });
  } catch (err) {
    console.error("[POST /api/ai-tools/summarize-contract]", err);
    res.status(500).json({ error: err.message || "Couldn't summarize that contract." });
  }
});

router.post("/draft-demand-letter", async (req, res) => {
  try {
    const { senderName, recipientName, facts, desiredOutcome, deadline } = req.body;
    if (!recipientName || !facts || !desiredOutcome) {
      return res.status(400).json({ error: "recipientName, facts, and desiredOutcome are required" });
    }
    const letter = await draftDemandLetter({
      senderName: senderName || "[Advocate Name]",
      recipientName,
      facts,
      desiredOutcome,
      deadline: deadline || "14 days from the date of this letter",
    });
    res.json({ letter });
  } catch (err) {
    console.error("[POST /api/ai-tools/draft-demand-letter]", err);
    res.status(500).json({ error: err.message || "Couldn't draft that letter." });
  }
});

router.post("/legal-opinion", async (req, res) => {
  try {
    const { question } = req.body;
    if (!question || !question.trim()) return res.status(400).json({ error: "question is required" });
    const result = await generateLegalOpinion(question);
    res.json(result);
  } catch (err) {
    console.error("[POST /api/ai-tools/legal-opinion]", err);
    res.status(500).json({ error: err.message || "Couldn't generate that opinion." });
  }
});

export default router;