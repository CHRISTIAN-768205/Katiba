import Anthropic from "@anthropic-ai/sdk";
import Article from "../models/Article.js";
import { embedOne } from "./embeddings.js";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = "claude-sonnet-5";

async function callClaude(system, userMessage, maxTokens = 1200) {
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    system,
    messages: [{ role: "user", content: userMessage }],
  });
  return response.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n");
}

const SUMMARIZE_SYSTEM = `You are a legal assistant helping a Kenyan advocate quickly review a contract before a client meeting.
Given the contract text, produce a concise, structured summary with these headers:
- **Parties** - who is involved
- **Key Obligations** - what each party must do
- **Important Dates/Deadlines**
- **Financial Terms**
- **Notable Risks or Unusual Clauses** - anything that seems one-sided, ambiguous, or worth flagging
- **Missing or Unclear** - anything a well-drafted contract would normally include but this one doesn't
Be direct and concise - this is a working tool for a busy advocate, not a client-facing document. If the text doesn't look like a contract at all, say so plainly instead of forcing a summary onto it.`;

export async function summarizeContract(text) {
  if (!text || text.trim().length < 50) {
    throw new Error("Paste in the contract text first - that's too short to meaningfully summarize.");
  }
  return callClaude(SUMMARIZE_SYSTEM, `Contract text:\n\n${text}`, 1200);
}

const DEMAND_LETTER_SYSTEM = `You are a legal assistant drafting a formal demand letter for a Kenyan advocate to send on
behalf of their client. Use standard Kenyan legal correspondence conventions: a formal header block
(date, recipient address), a clear reference line, a firm but professional tone, a plain statement of
the facts, the legal basis for the demand where the advocate has indicated one, a specific demand with
a deadline, and a statement of the consequences of non-compliance (e.g. legal proceedings) without
being needlessly aggressive. Output ONLY the letter text, ready to review and send - no commentary
before or after it.`;

export async function draftDemandLetter({ senderName, recipientName, recipientAddress, facts, desiredOutcome, deadline }) {
  if (!recipientName || !facts || !desiredOutcome) {
    throw new Error("recipientName, facts, and desiredOutcome are required");
  }
  const prompt = `Draft a demand letter with these details:
- From (advocate/firm): ${senderName || "[Advocate name]"}
- To: ${recipientName}
- Recipient address: ${recipientAddress || "[Address not provided - leave a placeholder]"}
- Facts of the matter: ${facts}
- Desired outcome / demand: ${desiredOutcome}
- Deadline for compliance: ${deadline || "14 days from the date of this letter"}`;
  return callClaude(DEMAND_LETTER_SYSTEM, prompt, 1200);
}

const OPINION_SYSTEM = `You are assisting a Kenyan advocate by drafting a preliminary legal opinion memo, grounded ONLY
in the constitutional/statutory provisions provided as context below - never invent a citation.
Structure the opinion with these headers:
- **Issue** - the precise legal question presented
- **Applicable Law** - the specific Articles/Sections provided in context, quoted or paraphrased accurately
- **Analysis** - how the law applies to the facts given
- **Preliminary Conclusion** - a reasoned but appropriately hedged conclusion
- **Caveats** - note clearly that this is a preliminary AI-assisted draft for the advocate's own review,
  not a final opinion, and that it should be verified against primary sources and current case law
  before use.
If the provided context doesn't cover the issue well, say so explicitly rather than reasoning beyond it.`;

export async function generateLegalOpinion(question) {
  if (!question || question.trim().length < 10) {
    throw new Error("Describe the legal question in more detail first.");
  }

  const queryVector = await embedOne(question, "query");
  const matches = await Article.aggregate([
    {
      $vectorSearch: {
        index: "article_vector_index",
        path: "embedding",
        queryVector,
        numCandidates: 100,
        limit: 6,
      },
    },
    {
      $project: {
        lawSource: 1,
        chapterTitle: 1,
        articleNumber: 1,
        articleTitle: 1,
        text: 1,
        score: { $meta: "vectorSearchScore" },
      },
    },
  ]);

  const context = matches
    .map((a) => {
      const label = (a.lawSource || "").includes("Constitution") ? "Article" : "Section";
      return `${label} ${a.articleNumber} - ${a.lawSource} (${a.chapterTitle}) - ${a.articleTitle}\n${a.text}`;
    })
    .join("\n\n---\n\n");

  const prompt = `Relevant provisions retrieved from the corpus:\n\n${context || "(none found)"}\n\n---\n\nLegal question: ${question}`;
  const opinion = await callClaude(OPINION_SYSTEM, prompt, 1500);

  return {
    opinion,
    sources: matches.map((m) => ({
      lawSource: m.lawSource,
      articleNumber: m.articleNumber,
      articleTitle: m.articleTitle,
    })),
  };
}