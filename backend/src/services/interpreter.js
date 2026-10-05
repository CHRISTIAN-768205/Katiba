import Anthropic from "@anthropic-ai/sdk";

// Use the latest stable model
const MODEL = "claude-3-5-sonnet-20241022";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `
You are the intelligent intake layer for Katiba AI, a Kenyan civic-legal information assistant.

The user's message could be:
(a) a direct question about the Constitution/law ("What is Article 43?"),
(b) a real-life situation they are describing, in English or Kiswahili, sometimes informally
    ("jana nilipigwa na wezi", "my landlord locked me out", "police arrested my brother and won't say why"),
(c) a vague cry for help ("I'm in trouble", "I need a lawyer", "They took everything"),
(d) a question about procedures ("How do I report a crime?", "What do I do after an accident?").

Your job is to INTERPRET the message, not to answer it. You must translate the user's natural language into structured data that our legal search engine can use.

Read the message carefully — including Sheng, code‑switching, and slang — and return a single JSON object, nothing else, no markdown fences, matching this exact shape:

{
  "language": "en" | "sw",
  "isNarrative": boolean,               // true if they are describing an event (past or ongoing), false if they are asking a direct factual question
  "situationSummary": string,           // 1‑2 sentence neutral restatement of what happened / what they're asking, in English, for internal use
  "legalTopics": string[],              // e.g. ["assault", "right to security", "reporting a crime", "landlord-tenant", "police accountability"]
  "searchQueries": string[],            // 2‑4 short English search phrases to find the most relevant constitutional articles/laws
  "urgency": "immediate" | "normal",    // "immediate" if there is an ongoing safety risk, unresolved arrest, eviction in progress, or acute medical need
  "confidence": number,                 // 0‑1 your confidence in this interpretation (0.8 if clear, 0.5 if ambiguous)
  "needLegalAdvice": boolean,           // true if the situation clearly requires a lawyer (e.g., "I've been charged", "I'm in court", "I'm being evicted today")
}

Guidelines:
- For searchQueries, think about ALL angles: the right that was violated, AND the process for getting help, AND any specific laws (e.g. "freedom and security of the person", "right to report a crime and access justice", "victims of crime rights").
- For "urgency", treat "immediate" only for:
  * On‑going threat of harm (assault in progress, domestic violence happening now)
  * Unlawful detention without access to lawyer
  * Eviction or lockout happening right now
  * Medical emergency
- For "needLegalAdvice", set true if the user explicitly asks for a lawyer, mentions court, charges, or a legal deadline.
- For "legalTopics", use general categories like: "family law", "land", "employment", "criminal", "constitutional", "consumer", "immigration", "environment".
- Be generous in inferring topics from lay descriptions — a person does not need to know legal terms to have their situation understood correctly.
- If the message is completely off‑topic (e.g., "What's the weather?"), return a default interpretation with "legalTopics": ["general"] and "searchQueries": ["general information"].
`;

/**
 * Interprets a user's natural‑language query for Katiba AI.
 * @param {string} rawInput - The user's message (may be in English or Kiswahili)
 * @param {Array} history - Optional array of previous messages (for context)
 * @returns {Promise<Object>} Interpretation object
 */
export async function interpretQuery(rawInput, history = []) {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is not set");
  }

  const userMessage = rawInput.trim();
  if (!userMessage) {
    return fallbackInterpretation("Empty message", "en");
  }

  // Build the messages array with optional history
  const messages = [];
  if (history && history.length > 0) {
    // Add up to the last 5 messages for context
    const context = history.slice(-5);
    for (const msg of context) {
      messages.push({
        role: msg.role === "assistant" ? "assistant" : "user",
        content: msg.content,
      });
    }
  }
  messages.push({ role: "user", content: userMessage });

  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 800,
      temperature: 0, // Lower temperature for consistent JSON
      system: SYSTEM_PROMPT,
      messages,
    });

    const text = response.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("");

    // Attempt to parse JSON
    let parsed = parseJSON(text);
    if (parsed) {
      // Validate some fields and ensure they exist
      return validateInterpretation(parsed);
    }

    // If parsing fails, try once more with a clearer instruction
    console.warn("First parse failed. Retrying with clarification...");
    const retryPrompt = `Your previous response was not valid JSON. Please ONLY output a valid JSON object matching the required shape, with no extra text. The user said: "${userMessage}"`;
    const retryResponse = await client.messages.create({
      model: MODEL,
      max_tokens: 800,
      temperature: 0.2,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: retryPrompt }],
    });
    const retryText = retryResponse.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("");
    parsed = parseJSON(retryText);
    if (parsed) {
      return validateInterpretation(parsed);
    }

    // Fallback: treat the raw input as a direct search query
    return fallbackInterpretation(userMessage, detectLanguage(userMessage));

  } catch (error) {
    console.error("Interpretation error:", error);
    // Fallback to a safe interpretation
    return fallbackInterpretation(userMessage, detectLanguage(userMessage));
  }
}

/**
 * Attempts to extract and parse JSON from text, even if surrounded by other text.
 */
function parseJSON(text) {
  // Try direct parse first
  try {
    return JSON.parse(text);
  } catch (_) {
    // Look for JSON-like content between { and } or [ and ]
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch (_) {}
    }
    return null;
  }
}

/**
 * Validates and ensures all required fields exist.
 */
function validateInterpretation(obj) {
  const defaultObj = {
    language: "en",
    isNarrative: false,
    situationSummary: "User query about legal matters.",
    legalTopics: ["general"],
    searchQueries: ["legal information"],
    urgency: "normal",
    confidence: 0.5,
    needLegalAdvice: false,
  };
  // Merge with defaults for missing fields
  const result = { ...defaultObj, ...obj };
  // Ensure arrays
  if (!Array.isArray(result.legalTopics)) result.legalTopics = [];
  if (!Array.isArray(result.searchQueries)) result.searchQueries = [];
  // Clean up
  result.situationSummary = result.situationSummary || defaultObj.situationSummary;
  if (!["en", "sw"].includes(result.language)) result.language = "en";
  if (!["immediate", "normal"].includes(result.urgency)) result.urgency = "normal";
  if (typeof result.confidence !== "number") result.confidence = 0.5;
  return result;
}

/**
 * Basic language detection (English vs Kiswahili).
 */
function detectLanguage(text) {
  const swahiliWords = ["ni", "mimi", "wewe", "yeye", "sisi", "nyinyi", "wao", "na", "kwa", "kwa", "kwamba", "kama", "bado", "tayari", "leo", "jana", "kesho", "hapa", "huko", "pale", "gani", "nini", "kwa nini", "lini", "vipi", "yako", "yangu", "yetu", "nyinyi", "ao"];
  const words = text.toLowerCase().split(/\s+/);
  const swCount = words.filter(w => swahiliWords.includes(w)).length;
  return swCount / words.length > 0.25 ? "sw" : "en";
}

/**
 * Fallback interpretation when all else fails.
 */
function fallbackInterpretation(message, lang) {
  return {
    language: lang,
    isNarrative: false,
    situationSummary: message,
    legalTopics: ["general"],
    searchQueries: [message],
    urgency: "normal",
    confidence: 0.3,
    needLegalAdvice: false,
  };
}