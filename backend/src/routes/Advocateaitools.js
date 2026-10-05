import Anthropic from "@anthropic-ai/sdk";
import { embedOne } from "./embeddings.js";
import { vectorSearch } from "./rag.js";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = "claude-sonnet-5";

async function ask(system, userMessage, maxTokens = 1500) {
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

/** Summarizes a contract's key terms, obligations, dates, and risk flags. */
export async function summarizeContract(contractText) {
  const system = `You are assisting a Kenyan advocate by summarizing a contract they've pasted in.
Produce a structured summary with these sections:
- **Parties** - who is involved
- **Key Obligations** - what each party must do
- **Important Dates/Deadlines** - anything time-bound
- **Payment Terms** - if any
- **Termination Conditions** - how the contract can end
- **Risk Flags** - clauses worth the advocate's closer attention (unusual liability, one-sided terms, ambiguous language, missing standard protections)

Be precise and reference the actual clause content, don't generalize. If the text doesn't look like a contract, say so plainly instead of inventing structure that isn't there. This is a drafting aid for a qualified advocate, not a substitute for their own review.`;

  return ask(system, `Contract text:\n\n${contractText}`, 2000);
}

/** Drafts a formal demand letter from structured inputs. */
export async function draftDemandLetter({ senderName, recipientName, facts, desiredOutcome, deadline }) {
  const system = `You are drafting a formal demand letter on behalf of a Kenyan advocate, in the
professional register used in Kenyan legal correspondence. Structure it properly: sender block,
date, recipient block, subject line ("RE: ..."), a clear statement of facts, the legal basis for
the demand (in general terms - you don't have case-specific legal research, so keep this to the
plain facts and the demand itself rather than citing specific statutes you're not certain apply),
the specific demand and deadline, and a professional closing warning of further action if unmet.
Do not fabricate case law, statute citations, or facts beyond what's given - leave placeholders
like "[cite applicable provision]" if legal grounding is needed, rather than inventing one.`;

  const userMessage = `Draft a demand letter with these details:
From (advocate/firm): ${senderName}
To: ${recipientName}
Facts of the matter: ${facts}
Desired outcome: ${desiredOutcome}
Deadline for compliance: ${deadline}`;

  return ask(system, userMessage, 1200);
}

/**
 * Generates a structured legal opinion, grounded in real retrieved provisions from the same
 * corpus (Constitution, Acts, case law) the citizen-facing chat uses - not just Claude's
 * unstructured recollection.
 */
export async function generateLegalOpinion(question) {
  const queryVector = await embedOne(question, "query");
  const matches = await vectorSearch(queryVector, 6);

  const context = matches
    .map((a) => {
      const label = (a.lawSource || "").includes("Constitution") ? "Article" : "Section";
      return `${label} ${a.articleNumber} - ${a.lawSource} (${a.chapterTitle}) - ${a.articleTitle}\n${a.text}`;
    })
    .join("\n\n---\n\n");

  const system = `You are drafting a legal opinion memo for a Kenyan advocate's own use, in a
professional register (not the plain-language style used for citizens). Structure it as:
- **Issue** - the legal question being addressed
- **Applicable Law** - the specific Articles/Sections provided in context, cited precisely
- **Analysis** - how the law applies to the question
- **Conclusion** - a direct answer

Base your analysis ONLY on the legal provisions provided below. If they don't fully cover the
question, say so explicitly and note what additional research or provisions would be needed -
never invent a citation. This is a drafting aid; the advocate remains responsible for verifying
and finalizing the opinion.`;

  const userMessage = matches.length
    ? `Relevant provisions retrieved:\n\n${context}\n\n---\n\nLegal question: ${question}`
    : `No directly relevant provisions were found in the indexed corpus for this question: ${question}\n\nState this plainly and suggest what area of law the advocate should research separately.`;

  const opinion = await ask(system, userMessage, 1800);
  return { opinion, sources: matches.map((m) => ({ lawSource: m.lawSource, articleNumber: m.articleNumber, articleTitle: m.articleTitle })) };
}