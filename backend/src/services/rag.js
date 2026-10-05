import Article from "../models/Article.js";
import Query from "../models/Query.js";
import { embed } from "./embeddings.js";
import { answerFromContext } from "./claude.js";
import { interpretQuery } from "./interpreter.js";

const VECTOR_INDEX_NAME = "article_vector_index"; // must match the Atlas Search index you create
const TOP_K_PER_QUERY = 4;
const MAX_ARTICLES_IN_CONTEXT = 8;

export async function vectorSearch(queryVector, limit = TOP_K_PER_QUERY) {
  try {
    return await Article.aggregate([
      {
        $vectorSearch: {
          index: VECTOR_INDEX_NAME,
          path: "embedding",
          queryVector,
          numCandidates: 100,
          limit,
        },
      },
      {
        $project: {
          lawSource: 1,
          chapterNumber: 1,
          chapterTitle: 1,
          articleNumber: 1,
          articleTitle: 1,
          text: 1,
          tags: 1,
          score: { $meta: "vectorSearchScore" },
        },
      },
    ]);
  } catch (err) {
    if (/index not found|\$vectorSearch/i.test(err.message || "")) {
      throw new Error(
        `The Atlas Vector Search index "${VECTOR_INDEX_NAME}" doesn't exist yet on the articles ` +
          `collection - the AI can't retrieve anything to interpret against until it's created. ` +
          `See backend/README.md step 3.`
      );
    }
    throw err;
  }
}

/**
 * Runs the core RAG pipeline for a user's message, with NO side effects (no DB logging):
 * interpret (understand a direct question OR a real-life situation, in EN/SW)
 * -> embed one or more search angles
 * -> Atlas Vector Search across all of them, merged and deduped
 * -> Claude generates a situation-aware answer (with concrete next steps for narratives).
 *
 * Shared by both /api/ask (one-off, logs to Query) and /api/chat (multi-turn, logs to Conversation).
 */
export async function generateAnswer({ question, language = "en" }) {
  if (!question || !question.trim()) {
    throw new Error("question is required");
  }

  // Step 1: understand what's actually being asked/described, regardless of phrasing or language.
  const interpretation = await interpretQuery(question);
  const searchQueries = interpretation.searchQueries?.length ? interpretation.searchQueries : [question];

  // Step 2: search from every angle the interpreter identified (e.g. "assault" AND "reporting a crime"),
  // then merge and dedupe by article so we don't send Claude the same article twice.
  const vectors = await embed(searchQueries, "query");
  const resultSets = await Promise.all(vectors.map((v) => vectorSearch(v)));

  const byArticle = new Map();
  for (const set of resultSets) {
    for (const article of set) {
      const key = `${article.chapterNumber}-${article.articleNumber}`;
      const existing = byArticle.get(key);
      if (!existing || article.score > existing.score) byArticle.set(key, article);
    }
  }
  const matches = [...byArticle.values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_ARTICLES_IN_CONTEXT);

  if (!matches.length) {
    return {
      answer:
        interpretation.language === "sw"
          ? "Sikuweza kupata sehemu husika ya Katiba kwa hali hiyo. Jaribu kueleza kwa maneno mengine, au uliza kuhusu haki, sura, au ibara mahususi."
          : "I couldn't find a relevant section of the Constitution for that. Try rephrasing, or ask about a specific right, chapter, or article.",
      urgency: interpretation.urgency,
      articles: [],
      interpretation,
    };
  }

  // Step 3: generate the answer, grounded in the merged context, aware of whether this was a
  // situation (needs steps) or a direct question (needs an explanation).
  const answer = await answerFromContext({ rawInput: question, interpretation, contextArticles: matches });

  return {
    answer,
    urgency: interpretation.urgency,
    interpretation,
    articles: matches.map((m) => ({
      articleId: m._id,
      lawSource: m.lawSource,
      chapterNumber: m.chapterNumber,
      chapterTitle: m.chapterTitle,
      articleNumber: m.articleNumber,
      articleTitle: m.articleTitle,
      relevance: m.score,
    })),
  };
}

/**
 * Same as generateAnswer, but also logs the exchange to the Query collection.
 * This is what powers the anonymous one-off /api/ask endpoint and the real
 * (non-mock) Popular Questions / Recently Viewed panels.
 */
export async function answerQuestion({ question, language = "en", userId = null }) {
  const result = await generateAnswer({ question, language });

  const logged = await Query.create({
    userId,
    question,
    language: result.interpretation.language || language,
    answer: result.answer,
    citedArticles: result.articles.map((a) => ({
      articleId: a.articleId,
      lawSource: a.lawSource,
      chapterNumber: a.chapterNumber,
      articleNumber: a.articleNumber,
      articleTitle: a.articleTitle,
    })),
  });

  return {
    id: logged._id,
    answer: result.answer,
    urgency: result.urgency,
    articles: result.articles,
  };
}