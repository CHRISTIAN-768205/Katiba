# Katiba AI — Backend

Real RAG API: MongoDB Atlas Vector Search (retrieval) + Voyage AI (embeddings) + Claude (generation).

## 1. Install

```bash
cd backend
npm install
cp .env.example .env
```

Fill in `.env`:
- `MONGODB_URI` — an **Atlas** cluster connection string (Vector Search requires Atlas, not a local/self-hosted Mongo).
- `ANTHROPIC_API_KEY` — from console.anthropic.com
- `VOYAGE_API_KEY` — free tier at dashboard.voyageai.com

## 2. Seed the database

The `data/` folder has real, verified seed content across two files (the seed script loads every
`*.seed.json` file automatically):
- `articles.seed.json` — Constitution of Kenya, 2010 (Articles 2, 14, 19, 27, 29, 43, 49, 50, 61, 176)
- `laws.seed.json` — Penal Code assault provisions (ss. 250, 251, 234), Victim Protection Act rights
  (ss. 6, 11, 20), and a practical procedure guide (how to report an assault and get a P3 form)

```bash
npm run seed
```

This embeds each entry with Voyage AI and upserts it into the `articles` collection, scoped by
`lawSource` so entries from different laws never collide.

**To load more:** add another `yourlaw.seed.json` file to `data/` in the same shape
(`{lawSource, chapterNumber, chapterTitle, articleNumber, articleTitle, text, tags}`) and re-run
`npm run seed` — it upserts, so it's safe to run repeatedly. Good next additions: the rest of the
Constitution's 264 articles, the Sexual Offences Act, the Domestic Violence Act (Protection Against
Domestic Violence Act 2015), and the Employment Act.

## 3. Create the Atlas Vector Search index

In Atlas → your cluster → Search → Create Search Index → JSON Editor, on the `articles` collection:

```json
{
  "fields": [
    {
      "type": "vector",
      "path": "embedding",
      "numDimensions": 1024,
      "similarity": "cosine"
    }
  ]
}
```

Name the index **`article_vector_index`** (must match `VECTOR_INDEX_NAME` in `src/services/rag.js`).

## 4. Run

```bash
npm run dev
```

Server starts on `http://localhost:5000`.

## How a question gets answered (updated pipeline)

`POST /api/ask` no longer just embeds your literal words. It now runs:

1. **Interpret** (`src/services/interpreter.js`) — Claude reads the message, which may be a direct
   question OR a real-life situation in English or Kiswahili ("jana nilipigwa na wezi, nifanye
   nini?"), and returns structured JSON: detected language, whether it's a narrative, a neutral
   situation summary, the legal topics involved, 2-4 search angles, and an urgency flag.
2. **Retrieve** (`src/services/rag.js`) — each search angle gets embedded and vector-searched
   separately, then results are merged/deduped so Claude sees articles relevant to every angle of
   the situation (e.g. for an assault: both "freedom and security of the person" AND "reporting a
   crime / access to justice").
3. **Generate** (`src/services/claude.js`) — if it was a narrative, the answer is structured as
   Direct Answer → Immediate Steps → Your Rights → Plain-Language Explanation. If it was a direct
   question, it skips straight to Direct Answer → Constitutional Basis → Explanation.

**Known limitation:** the Constitution alone doesn't cover procedural detail like "how to get a P3
form" — that lives in the Penal Code, the Victim Protection Act 2014, and the National Police
Service Act. Claude is instructed not to invent their content, but for genuinely good step-by-step
guidance you'll want to add those Acts to the `articles` collection the same way (they don't have
to be literally "articles" — just add `documentType` / `actName` fields and index them alongside).

## Endpoints

| Method | Route | Description |
|---|---|---|
| POST | `/api/ask` | `{ question, language }` → RAG answer grounded in retrieved articles |
| GET | `/api/articles?chapter=4&tag=bill-of-rights` | Browse articles |
| GET | `/api/articles/:chapterNumber/:articleNumber` | One article |
| GET | `/api/articles/meta/chapters` | Chapter list for category browsing |
| GET | `/api/history/recent?userId=` | Real recently-viewed questions |
| GET | `/api/history/popular` | Real most-asked questions |