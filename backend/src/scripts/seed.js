import "dotenv/config";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { connectDB } from "../config/db.js";
import Article from "../models/Article.js";
import { embed } from "../services/embeddings.js";
import mongoose from "mongoose";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "../../data");
const BATCH_SIZE = 20;
const DRY_RUN = process.argv.includes("--dry-run");

const REQUIRED_FIELDS = ["chapterNumber", "chapterTitle", "articleNumber", "articleTitle", "text"];

/** Strips leftover "[reference:N]" citation-tool artifacts that shouldn't reach end users. */
function cleanText(str) {
  return typeof str === "string" ? str.replace(/\[reference:\d+\]/g, "").trim() : str;
}

/**
 * Flattens one rich "chapter document" - {chapterNumber, chapterTitle, lawSource, type, ...}
 * with either a `parts` array (each holding its own `articles`) or an `articles` array directly
 * on the chapter - into individual flat article entries the rest of the pipeline expects.
 */
function flattenChapterDocument(chapterDoc) {
  const { chapterNumber, chapterTitle, lawSource, type, parts, articles } = chapterDoc;
  const flat = [];

  function addArticle(article, partNumber = null, partTitle = null) {
    const officialText = cleanText(article.officialText);
    flat.push({
      lawSource: lawSource || "Constitution of Kenya, 2010",
      type: type || "constitution",
      chapterNumber,
      chapterTitle,
      partNumber,
      partTitle,
      articleNumber: article.articleNumber,
      articleTitle: article.articleTitle,
      officialText,
      text: officialText, // kept for backward compatibility with every existing generic code path
      plainLanguage: cleanText(article.plainLanguage),
      commonQuestions: article.commonQuestions || [],
      realLifeExamples: article.realLifeExamples || [],
      legalConcepts: article.legalConcepts || [],
      crossReferenceExplanations: article.crossReferenceExplanations || null,
      relevantLegislation: article.relevantLegislation || [],
      relevantCaseLaw: article.relevantCaseLaw || [],
      swahiliTranslation: cleanText(article.swahiliTranslation),
      searchSynonyms: article.searchSynonyms || [],
      disclaimer: article.disclaimer || null,
      tags: article.tags || [],
    });
  }

  if (Array.isArray(parts)) {
    for (const part of parts) {
      for (const article of part.articles || []) {
        addArticle(article, part.partNumber, part.partTitle);
      }
    }
  } else if (Array.isArray(articles)) {
    for (const article of articles) addArticle(article);
  }

  return flat;
}

async function loadAllSeedFiles() {
  const files = (await fs.readdir(DATA_DIR)).filter((f) => f.endsWith(".seed.json"));
  if (files.length === 0) {
    throw new Error(`No *.seed.json files found in ${DATA_DIR}`);
  }

  let all = [];
  for (const file of files) {
    const raw = await fs.readFile(path.join(DATA_DIR, file), "utf-8");
    const items = JSON.parse(raw);

    const flatItems = [];
    for (const item of items) {
      if (item.articleNumber !== undefined) {
        // Already a flat article entry (the simpler format used by Penal Code, Employment Act, etc.)
        flatItems.push(item);
      } else if (Array.isArray(item.parts) || Array.isArray(item.articles)) {
        // A rich nested chapter document - flatten it into individual articles.
        flatItems.push(...flattenChapterDocument(item));
      } else {
        console.warn(`[seed] Skipping an entry in ${file} with an unrecognized shape (no articleNumber, parts, or articles)`);
      }
    }

    console.log(`[seed] Loaded ${flatItems.length} entries from ${file}`);
    all = all.concat(flatItems.map((item) => ({ ...item, __sourceFile: file })));
  }
  return all;
}

/** Fail loudly on malformed entries before spending any embedding API calls on them. */
function validate(entries) {
  const errors = [];
  const seenKeys = new Set();

  for (const [i, entry] of entries.entries()) {
    const where = `${entry.__sourceFile}[${i}] (Art./Sec. ${entry.articleNumber})`;
    for (const field of REQUIRED_FIELDS) {
      if (entry[field] === undefined || entry[field] === null || entry[field] === "") {
        errors.push(`${where}: missing required field "${field}"`);
      }
    }
    const key = `${entry.lawSource || "Constitution of Kenya, 2010"}::${entry.chapterNumber}::${entry.articleNumber}`;
    if (seenKeys.has(key)) {
      errors.push(`${where}: duplicate entry within this seed run (${key})`);
    }
    seenKeys.add(key);
  }

  if (errors.length) {
    throw new Error(`Seed data validation failed:\n  - ${errors.join("\n  - ")}`);
  }
}

/** Richer embedding input when the annotated fields are available - meaningfully improves retrieval. */
function buildEmbeddingText(a) {
  const parts = [a.articleTitle, a.officialText || a.text];
  if (a.plainLanguage) parts.push(a.plainLanguage);
  if (a.commonQuestions?.length) parts.push(a.commonQuestions.join(" "));
  if (a.searchSynonyms?.length) parts.push(a.searchSynonyms.join(", "));
  return parts.filter(Boolean).join("\n");
}

async function main() {
  const entries = await loadAllSeedFiles();
  validate(entries);
  console.log(`[seed] ${entries.length} entries validated across ${new Set(entries.map((e) => e.lawSource || "Constitution of Kenya, 2010")).size} law sources`);

  if (DRY_RUN) {
    console.log("[seed] --dry-run set: validated only, nothing written. Re-run without --dry-run to seed for real.");
    return;
  }

  await connectDB();

  const counts = {};
  for (let i = 0; i < entries.length; i += BATCH_SIZE) {
    const batch = entries.slice(i, i + BATCH_SIZE);
    const vectors = await embed(batch.map(buildEmbeddingText), "document");

    for (let j = 0; j < batch.length; j++) {
      const { __sourceFile, ...a } = batch[j];
      const lawSource = a.lawSource || "Constitution of Kenya, 2010";
      await Article.findOneAndUpdate(
        { lawSource, chapterNumber: a.chapterNumber, articleNumber: a.articleNumber },
        { ...a, lawSource, embedding: vectors[j] },
        { upsert: true, new: true }
      );
      counts[lawSource] = (counts[lawSource] || 0) + 1;
      console.log(`[seed] Upserted [${lawSource}] #${a.articleNumber} (${a.chapterTitle}) - ${a.articleTitle}`);
    }
  }

  console.log(`\n[seed] Done. ${entries.length} entries indexed:`);
  for (const [source, count] of Object.entries(counts)) {
    console.log(`[seed]   - ${source}: ${count}`);
  }
  console.log(`\n[seed] IMPORTANT: create the Atlas Vector Search index named "article_vector_index"`);
  console.log(`[seed] on the "articles" collection, field "embedding", 1024 dimensions, cosine similarity.`);
  console.log(`[seed] Then run: npm run check   -- to verify everything (including that index) is wired up.`);

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("[seed] Failed:", err.message);
  process.exit(1);
});