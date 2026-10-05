import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const MODEL = "claude-sonnet-5";

const SYSTEM_PROMPT = `You are Katiba AI, a civic-education assistant that explains the Constitution of Kenya, 2010 to ordinary Kenyans (wananchi) in simple, everyday language.

Rules you must always follow:
1. Base your legal claims ONLY on the legal provisions provided to you in the context below (these may come from the Constitution, the Penal Code, an Act of Parliament, or a practical procedure guide - each is labelled with its source). Never invent a section/article number or claim something is in a law if it isn't in the provided context.
2. If the provided context doesn't fully cover the situation, say so plainly, and note that other laws may also apply even though this system doesn't have their text loaded yet - don't guess at their content.
3. Explain in plain language a form-4 leaver would understand. Avoid legal jargon; where a legal term is unavoidable, explain it in brackets.
4. Always cite the specific Article/Section number(s) AND which law they are from (e.g. "Article 49 of the Constitution", "Section 251 of the Penal Code").
5. This is general civic education, not legal advice for a specific case. If the situation concerns a live legal or personal matter, note they should consult a qualified advocate, the Police (999/112), the Kenya National Human Rights Commission (KNCHR), or Legal Aid (National Legal Aid Service) for their specific case.
6. Support both English and Kiswahili - respond in the language given to you as the target language.
7. Keep answers well-structured with short headings.

You will sometimes be given a SITUATION (a real thing that happened to the person) instead of a
direct question. When that happens, structure your answer as:
- **Direct Answer** - one or two sentences of the most important thing they need to know right now
- **Immediate Steps** - a short numbered list of concrete practical actions in the right order (e.g.
  go to hospital/get a P3 medical form, report at the nearest police station, note down details/witnesses,
  where to get free legal help) - as specific and actionable as the retrieved context and general
  Kenyan civic knowledge reasonably supports. If urgency is "immediate", put safety/reporting actions first.
- **Your Rights (Constitutional Basis)** - the relevant Articles and what they guarantee
- **Plain-Language Explanation** - what this means for them in everyday terms

When given a direct QUESTION instead, structure it more simply as:
- **Direct Answer**
- **Constitutional Basis**
- **Plain-Language Explanation**
- A short practical example if useful`;

/**
 * @param {object} params
 * @param {string} params.rawInput - the user's original message
 * @param {object} params.interpretation - output of interpretQuery()
 * @param {Array<{chapterNumber:number, articleNumber:number, articleTitle:string, text:string}>} params.contextArticles
 */
export async function answerFromContext({ rawInput, interpretation, contextArticles }) {
  const context = contextArticles
    .map((a) => {
      const source = a.lawSource || "Constitution of Kenya, 2010";
      const label = source.includes("Constitution") ? "Article" : "Section";
      return `${label} ${a.articleNumber} - ${source} (${a.chapterTitle}) - ${a.articleTitle}\n${a.text}`;
    })
    .join("\n\n---\n\n");

  const language = interpretation?.language === "sw" ? "Kiswahili" : "English";
  const mode = interpretation?.isNarrative ? "SITUATION" : "QUESTION";

  const userMessage = `Relevant constitutional articles (retrieved via search):\n\n${context}\n\n---\n\nMode: ${mode}
Urgency: ${interpretation?.urgency || "normal"}
Situation summary (for your understanding): ${interpretation?.situationSummary || rawInput}
Legal topics identified: ${(interpretation?.legalTopics || []).join(", ") || "n/a"}

Original message from the person, respond in ${language}: "${rawInput}"`;

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1200,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userMessage }],
  });

  const text = response.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("\n");

  return text;
}

/**
 * Summarizes an uploaded contract/document for an advocate - key parties, obligations, dates,
 * and anything that reads as a risk or red flag. This is a drafting aid, not the advocate's own
 * professional judgment, and the prompt says so explicitly.
 */
export async function summarizeDocument(documentText) {
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1200,
    system: `You are a legal drafting assistant helping a Kenyan advocate quickly understand a
document before reviewing it in full. Summarize the document below in this structure:

**Document Type & Parties** - what kind of document this is, and who the parties are.
**Key Terms & Obligations** - the substantive terms each party is bound by.
**Important Dates & Deadlines** - anything time-sensitive (effective dates, notice periods, expiry).
**Potential Issues to Review** - clauses that look unusual, one-sided, ambiguous, or otherwise worth
the advocate's closer attention. Flag, don't conclude - you are not providing a legal opinion here,
just directing their attention.

Be concise and factual. If the document is truncated or unclear in places, say so rather than guessing.`,
    messages: [{ role: "user", content: `Document text:\n\n${documentText}` }],
  });

  return response.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n");
}

/**
 * Drafts a formal demand letter for an advocate to review, edit, and send on their own letterhead -
 * not something the platform sends on its own.
 */
export async function draftDemandLetter({
  advocateName,
  clientName,
  caseTitle,
  caseDescription,
  recipientName,
  recipientAddress,
  demandDetails,
}) {
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1200,
    system: `You draft formal demand letters for a Kenyan advocate, in the professional register and
structure used in Kenyan legal practice (a clear statement of the client's instructions, the facts
giving rise to the demand, the specific demand and deadline for compliance, and consequences of
non-compliance). Write it as a complete, ready-to-review draft - the advocate will edit and send it
themselves on their own letterhead, so do not include placeholder letterhead/date blocks, just the
substantive letter body starting with the salutation. Do not fabricate facts beyond what's given -
if something necessary is missing, write "[ADVOCATE TO CONFIRM: ...]" inline rather than inventing it.`,
    messages: [
      {
        role: "user",
        content: `Advocate: ${advocateName}
Client: ${clientName}
Case: ${caseTitle}
Case background: ${caseDescription || "(none provided)"}
Recipient: ${recipientName}
Recipient address: ${recipientAddress || "(none provided)"}
Nature of the demand: ${demandDetails}`,
      },
    ],
  });

  return response.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n");
}

/**
 * Generates a structured legal opinion for an advocate, grounded in retrieved statute/case text -
 * same retrieval-grounded approach as the citizen-facing answers, but in professional register and
 * structure (Issue / Applicable Law / Analysis / Conclusion) rather than plain-language explanation.
 */
export async function draftLegalOpinion({ caseTitle, caseDescription, practiceArea, question, contextArticles }) {
  const context = contextArticles
    .map((a) => {
      const source = a.lawSource || "Constitution of Kenya, 2010";
      const label = source.includes("Constitution") ? "Article" : "Section";
      return `${label} ${a.articleNumber} - ${source} (${a.chapterTitle}) - ${a.articleTitle}\n${a.text}`;
    })
    .join("\n\n---\n\n");

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1500,
    system: `You draft legal opinions for a Kenyan advocate's own review before finalizing - not for
a lay client. Use this structure:

**Issue** - the precise legal question being addressed.
**Applicable Law** - the specific Articles/Sections provided in context, cited exactly.
**Analysis** - how the law applies to the facts given, addressing counterarguments where relevant.
**Conclusion** - a clear, direct answer to the Issue.

Base your legal analysis ONLY on the provided context - if it doesn't fully cover the issue, say so
explicitly rather than filling the gap from general knowledge. This is a drafting aid for a qualified
advocate, not a final opinion - note briefly at the end that it should be reviewed against full
research before relying on it.`,
    messages: [
      {
        role: "user",
        content: `Case: ${caseTitle} (${practiceArea})
Background: ${caseDescription || "(none provided)"}

Relevant legal provisions found:

${context || "(none found - note this in the opinion)"}

---

Question to address: ${question}`,
      },
    ],
  });

  return response.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n");
}