import "dotenv/config";
import mongoose from "mongoose";
import Article from "../models/Article.js";
import { embedOne } from "../services/embeddings.js";
import { interpretQuery } from "../services/interpreter.js";

const checks = [];
function report(name, ok, detail = "") {
  checks.push({ name, ok, detail });
  console.log(`${ok ? "✅" : "❌"} ${name}${detail ? ` - ${detail}` : ""}`);
}

async function main() {
  console.log("[check] Running Katiba AI setup diagnostics...\n");

  // 1. Env vars present
  const required = ["MONGODB_URI", "ANTHROPIC_API_KEY", "VOYAGE_API_KEY", "JWT_SECRET"];
  for (const key of required) {
    report(`env: ${key} is set`, !!process.env[key]);
  }
  if (required.some((k) => !process.env[k])) {
    console.log("\n[check] Fix the missing env vars above (see .env.example) before continuing.");
    process.exit(1);
  }

  // 2. MongoDB connects
  try {
    await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 8000 });
    report("MongoDB connection", true, mongoose.connection.name);
  } catch (err) {
    report("MongoDB connection", false, err.message);
    process.exit(1);
  }

  // 3. Articles are seeded
  const count = await Article.countDocuments();
  report("Articles seeded", count > 0, count > 0 ? `${count} entries` : "run `npm run seed`");

  // 4. Voyage embeddings API works
  let queryVector = null;
  try {
    queryVector = await embedOne("what are my rights when arrested", "query");
    report("Voyage embeddings API", Array.isArray(queryVector) && queryVector.length > 0, `${queryVector?.length} dims`);
  } catch (err) {
    report("Voyage embeddings API", false, err.message);
  }

  // 5. Atlas Vector Search index exists and is queryable
  if (queryVector) {
    try {
      const results = await Article.aggregate([
        {
          $vectorSearch: {
            index: "article_vector_index",
            path: "embedding",
            queryVector,
            numCandidates: 50,
            limit: 1,
          },
        },
      ]);
      report(
        "Atlas Vector Search index (article_vector_index)",
        true,
        results.length ? `test query matched "${results[0].articleTitle}"` : "index exists but returned no matches (seed more data?)"
      );
    } catch (err) {
      report("Atlas Vector Search index (article_vector_index)", false, "not found - create it in Atlas, see backend/README.md step 3");
    }
  }

  // 6. Claude API + interpreter work end-to-end
  try {
    const interpretation = await interpretQuery("what are my rights when arrested?");
    report("Claude API (interpreter)", !!interpretation.searchQueries?.length, `detected language: ${interpretation.language}`);
  } catch (err) {
    report("Claude API (interpreter)", false, err.message);
  }

  const failed = checks.filter((c) => !c.ok);
  console.log(
    failed.length === 0
      ? "\n[check] All checks passed - the AI pipeline is fully wired up. Run `npm run dev`."
      : `\n[check] ${failed.length} check(s) failed. Fix them in order - later checks often fail as a side-effect of earlier ones.`
  );

  await mongoose.disconnect();
  process.exit(failed.length === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error("[check] Unexpected error:", err);
  process.exit(1);
});