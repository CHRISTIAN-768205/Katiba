import "dotenv/config";
import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { connectDB } from "./src/config/db.js";
import askRoute from "./src/routes/ask.js";
import articlesRoute from "./src/routes/articles.js";
import historyRoute from "./src/routes/history.js";
import authRoute from "./src/routes/auth.js";
import chatRoute from "./src/routes/chat.js";
import advocatesRoute from "./src/routes/advocates.js";
import requestsRoute from "./src/routes/requests.js";
import calendarRoute from "./src/routes/calendar.js";
import casesRoute from "./src/routes/cases.js";
import messagesRoute from "./src/routes/messages.js";
import documentsRoute from "./src/routes/documents.js";
import reviewsRoute from "./src/routes/reviews.js";
import analyticsRoute from "./src/routes/analytics.js";
import aiToolsRoute from "./src/routes/aiTools.js";
import savedRoutes from "./src/routes/saved.js";

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN || "*" }));
app.use(express.json());

// Ask/chat hit Claude + Voyage on every call, so keep them rate-limited.
const askLimiter = rateLimit({ windowMs: 60 * 1000, max: 20 });
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20 }); // guard against credential stuffing

app.get("/api/health", (req, res) => res.json({ status: "ok" }));
app.use("/api/auth", authLimiter, authRoute);
app.use("/api/ask", askLimiter, askRoute);
app.use("/api/chat", askLimiter, chatRoute);
app.use("/api/articles", articlesRoute);
app.use("/api/history", historyRoute);
app.use("/api/advocates", advocatesRoute);
app.use("/api/requests", requestsRoute);
app.use("/api/calendar", calendarRoute);
app.use("/api/cases", casesRoute);
app.use("/api/messages", messagesRoute);
app.use("/api/documents", documentsRoute);
app.use("/api/reviews", reviewsRoute);
app.use("/api/analytics", analyticsRoute);
app.use("/api/ai-tools", askLimiter, aiToolsRoute);
app.use("/api/saved", savedRoutes);

app.use((req, res) => res.status(404).json({ error: "Not found" }));

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    app.listen(PORT, () => console.log(`[server] Katiba AI API running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("[server] Failed to start:", err.message);
    process.exit(1);
  });