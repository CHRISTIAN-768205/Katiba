import axios from "axios";

const VOYAGE_URL = "https://api.voyageai.com/v1/embeddings";
const MODEL = "voyage-3";
const EMBEDDING_DIMENSIONS = 1024; // must match Article.embedding's expected size and the Atlas index

// Voyage caps requests at 128 texts per call - chunk larger batches automatically so callers
// never have to think about this (seed.js already batches by 20 anyway, but this is a safety net).
const MAX_TEXTS_PER_REQUEST = 128;
const MAX_RETRIES = 5;
const REQUEST_TIMEOUT_MS = 20000;
// Voyage's free tier (no payment method on file) is capped at 3 requests/minute - a sub-second
// retry never has a chance there. Default to a realistic ~20s wait for 429s specifically, but
// prefer the Retry-After header if Voyage sends one.
const RATE_LIMIT_BACKOFF_MS = 20000;
const SERVER_ERROR_BACKOFF_MS = 1000;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function embedBatch(texts, inputType, attempt = 1) {
  try {
    const { data } = await axios.post(
      VOYAGE_URL,
      { model: MODEL, input: texts, input_type: inputType },
      {
        headers: { Authorization: `Bearer ${process.env.VOYAGE_API_KEY}` },
        timeout: REQUEST_TIMEOUT_MS,
      }
    );

    // Voyage doesn't guarantee response order matches request order - sort by the index it returns.
    return data.data.sort((a, b) => a.index - b.index).map((d) => d.embedding);
  } catch (err) {
    const status = err.response?.status;

    if (status === 429 && attempt < MAX_RETRIES) {
      const retryAfterHeader = Number(err.response?.headers?.["retry-after"]);
      const waitMs = Number.isFinite(retryAfterHeader) && retryAfterHeader > 0
        ? retryAfterHeader * 1000
        : RATE_LIMIT_BACKOFF_MS * attempt;
      console.warn(
        `[embeddings] Voyage API 429 (rate limited) - waiting ${Math.round(waitMs / 1000)}s before retrying ` +
          `(attempt ${attempt}/${MAX_RETRIES}). Add a payment method at dashboard.voyageai.com to unlock ` +
          `standard rate limits (free token grant still applies - this doesn't start charging you).`
      );
      await sleep(waitMs);
      return embedBatch(texts, inputType, attempt + 1);
    }

    if (status >= 500 && status < 600 && attempt < MAX_RETRIES) {
      const backoffMs = SERVER_ERROR_BACKOFF_MS * 2 ** (attempt - 1);
      console.warn(`[embeddings] Voyage API ${status}, retrying in ${backoffMs}ms (attempt ${attempt}/${MAX_RETRIES})`);
      await sleep(backoffMs);
      return embedBatch(texts, inputType, attempt + 1);
    }

    if (status === 401) {
      throw new Error("Voyage API rejected the request - check VOYAGE_API_KEY is correct.");
    }
    if (err.code === "ECONNABORTED") {
      throw new Error("Voyage API request timed out.");
    }
    throw new Error(`Voyage embeddings API failed: ${err.response?.data?.detail || err.message}`);
  }
}

/**
 * Embed one or more strings. Returns an array of vectors (float arrays),
 * in the same order as the input.
 * @param {string[]} texts
 * @param {"document"|"query"} inputType - Voyage tunes embeddings differently for
 *   documents being indexed vs. the live search query. Always pass "query" for
 *   user questions and "document" when seeding the database.
 */
export async function embed(texts, inputType = "document") {
  if (!process.env.VOYAGE_API_KEY) {
    throw new Error("VOYAGE_API_KEY is not set");
  }
  if (!Array.isArray(texts) || texts.length === 0) return [];

  const cleaned = texts.map((t) => (typeof t === "string" ? t.trim() : ""));
  const emptyIndex = cleaned.findIndex((t) => t.length === 0);
  if (emptyIndex !== -1) {
    throw new Error(`embed(): texts[${emptyIndex}] is empty - Voyage can't embed an empty string.`);
  }

  // Chunk into requests of at most MAX_TEXTS_PER_REQUEST, run sequentially to stay well
  // within rate limits, then flatten back into one array matching the original order.
  const results = [];
  for (let i = 0; i < cleaned.length; i += MAX_TEXTS_PER_REQUEST) {
    const chunk = cleaned.slice(i, i + MAX_TEXTS_PER_REQUEST);
    const vectors = await embedBatch(chunk, inputType);
    results.push(...vectors);
  }

  return results;
}

export async function embedOne(text, inputType = "document") {
  const [vector] = await embed([text], inputType);
  return vector;
}

export { EMBEDDING_DIMENSIONS };