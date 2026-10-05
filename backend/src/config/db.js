import mongoose from "mongoose";
import Article from "../models/Article.js";

/**
 * Connects to MongoDB and verifies the two things Katiba AI's understanding/retrieval
 * pipeline actually depends on at runtime:
 *   1. There are embedded articles/sections in the database (run `npm run seed` if not).
 *   2. A reminder that the Atlas Vector Search index must exist for Article.aggregate()'s
 *      $vectorSearch stage (used in src/services/rag.js) to return anything - Mongoose can
 *      create normal indexes automatically, but a Vector Search index is an Atlas-side
 *      resource and can't be created from code, so we can't verify it exists here, only
 *      remind you.
 * Interpretation (src/services/interpreter.js) itself doesn't touch the DB at all - it's a
 * pure Claude call - but it's useless without retrieval finding anything to interpret against.
 */
export async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not set. Copy .env.example to .env and fill it in.");
  }

  mongoose.set("strictQuery", true);

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10000,
  });
  console.log(`[db] Connected to MongoDB: ${mongoose.connection.name}`);

  mongoose.connection.on("error", (err) => {
    console.error("[db] Connection error:", err);
  });
  mongoose.connection.on("disconnected", () => {
    console.warn("[db] Disconnected from MongoDB");
  });

  // Keep normal (non-vector) Mongoose indexes - e.g. User.email uniqueness - in sync automatically
  // outside production, where you'd rather manage index changes deliberately.
  if (process.env.NODE_ENV !== "production") {
    await mongoose.connection.syncIndexes();
  }

  const articleCount = await Article.countDocuments();
  if (articleCount === 0) {
    console.warn(
      "[db] No articles found. The AI has nothing to retrieve or interpret against yet.\n" +
        "[db] Run `npm run seed` to load the Constitution/Penal Code/Victim Protection Act sample data."
    );
  } else {
    console.log(`[db] ${articleCount} legal provisions indexed and ready for retrieval.`);
  }
  console.log(
    '[db] Reminder: retrieval requires an Atlas Vector Search index named "article_vector_index" ' +
      "on the articles collection (field: embedding, 1024 dims, cosine) - see backend/README.md."
  );

  // Close the connection cleanly on shutdown instead of leaving it hanging.
  for (const signal of ["SIGINT", "SIGTERM"]) {
    process.on(signal, async () => {
      await mongoose.connection.close();
      console.log("[db] Connection closed, shutting down.");
      process.exit(0);
    });
  }

  return mongoose.connection;
}