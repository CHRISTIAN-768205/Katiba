// src/routes/auth.js
import { Router } from "express";
import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import User from "../models/User.js";
import ConsultationRequest from "../models/ConsultationRequest.js";
import Case from "../models/Case.js";
import Message from "../models/Message.js";
import Document from "../models/Document.js";
import Review from "../models/Review.js";
// import Escalation from "../models/Escalation.js";
import { hashPassword, comparePassword, signToken } from "../services/authService.js";
import { requireAuth } from "../middleware/auth.js";
import {
  sendVerificationRequestEmail,
  sendVerificationResultEmail,
} from "../services/emailService.js";

// Uploads directory — adjust if yours lives elsewhere
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOADS_DIR = path.join(__dirname, "..", "..", "uploads");

const router = Router();

// ---- Bar / MAC number validators (inline for clarity) ----
function isValidBarNumber(v) {
  if (!v || typeof v !== "string") return false;
  const cleaned = v.trim().toUpperCase();
  return [
    /^LSK\/\d{4}\/\d{3,6}$/,        // LSK/2020/12345
    /^P\.\d{2,4}\/\d{3,5}\/\d{4}$/, // P.105/1234/2020
    /^\d{3,5}\/\d{4}$/,             // 1234/2020
  ].some((p) => p.test(cleaned));
}
function normalizeBarNumber(v) {
  return v.trim().toUpperCase().replace(/\s+/g, "");
}
function isValidMediationNumber(v) {
  if (!v || typeof v !== "string") return false;
  return /^MAC\/\d{4}\/\d{3,5}$/.test(v.trim().toUpperCase());
}
function normalizeMediationNumber(v) {
  return v.trim().toUpperCase().replace(/\s+/g, "");
}

// ---- Signed verification tokens (HMAC-SHA256, 7-day TTL) ----
const VERIFICATION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function getVerificationSecret() {
  const secret = process.env.VERIFICATION_SECRET;
  if (!secret) {
    console.warn(
      "[auth] VERIFICATION_SECRET is not set - falling back to JWT_SECRET. " +
      "Set VERIFICATION_SECRET in .env for production."
    );
  }
  return secret || process.env.JWT_SECRET;
}

function makeVerificationToken(userId) {
  const exp = Date.now() + VERIFICATION_TTL_MS;
  const payload = `${userId}.${exp}`;
  const sig = crypto
    .createHmac("sha256", getVerificationSecret())
    .update(payload)
    .digest("hex");
  return `${payload}.${sig}`;
}

function verifyVerificationToken(token) {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [userId, exp, sig] = parts;

  const expected = crypto
    .createHmac("sha256", getVerificationSecret())
    .update(`${userId}.${exp}`)
    .digest("hex");

  const sigBuf = Buffer.from(sig, "hex");
  const expBuf = Buffer.from(expected, "hex");
  if (sigBuf.length !== expBuf.length) return null;
  if (!crypto.timingSafeEqual(sigBuf, expBuf)) return null;
  if (Date.now() > Number(exp)) return null;

  return { userId };
}

// ============================================================
// POST /api/auth/register
// ============================================================
router.post("/register", async (req, res) => {
  // 🔍 DEBUG — remove once registration is confirmed working
  console.log("📥 REGISTER BODY:", JSON.stringify(req.body, null, 2));

  // ── SAFETY NET ──────────────────────────────────────────────
  // Handles the legacy frontend bug where the whole payload lands
  // inside `name` due to a positional-vs-object signature mismatch.
  let body = req.body;
  if (
    body &&
    typeof body.name === "object" &&
    body.name !== null &&
    typeof body.name.email === "string"
  ) {
    console.warn("[auth] Detected nested payload — unwrapping from `name`.");
    body = body.name;
  }
  // ────────────────────────────────────────────────────────────

  try {
    const {
      name,
      email,
      password,
      role = "citizen",
      phone,
      bio,

      // Advocate fields
      barNumber,
      lawFirm,
      yearsOfExperience,
      practiceAreas,

      // Mediator fields
      mediationNumber,
      mediatorProfession,
      mediationSpecialties,
      mediationStyle,
      mediationFeeRange,
    } = body;

    // ---- Base validation ----
    if (!name || !email || !password) {
      return res.status(400).json({ error: "name, email and password are required" });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters" });
    }
    if (!["citizen", "advocate", "mediator"].includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }

    // ---- Duplicate email ----
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ error: "An account with that email already exists" });
    }

    // ---- Role-specific validation ----
    let normalizedBar = null;
    let normalizedMac = null;

    if (role === "advocate") {
      if (!isValidBarNumber(barNumber)) {
        return res.status(400).json({
          error: "Invalid bar number format. Use LSK/YYYY/NNNNN.",
        });
      }
      normalizedBar = normalizeBarNumber(barNumber);

      const dupeBar = await User.findOne({ barNumber: normalizedBar });
      if (dupeBar) {
        return res.status(409).json({ error: "This bar number is already registered" });
      }

      if (!lawFirm || !practiceAreas?.length) {
        return res.status(400).json({
          error: "lawFirm and at least one practice area are required for advocates",
        });
      }
    }

    if (role === "mediator") {
      if (!isValidMediationNumber(mediationNumber)) {
        return res.status(400).json({
          error: "Invalid MAC number format. Use MAC/YYYY/NNNN.",
        });
      }
      normalizedMac = normalizeMediationNumber(mediationNumber);

      const dupeMac = await User.findOne({ mediationNumber: normalizedMac });
      if (dupeMac) {
        return res.status(409).json({ error: "This MAC number is already registered" });
      }

      if (!mediatorProfession || !mediationSpecialties?.length) {
        return res.status(400).json({
          error: "mediatorProfession and at least one specialty are required for mediators",
        });
      }
    }

    // ---- Hash & create ----
    const passwordHash = await hashPassword(password);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role,
      phone: phone || null,
      bio: bio || "",

      ...(role === "advocate" && {
        barNumber: normalizedBar,
        lawFirm,
        yearsOfExperience: Number(yearsOfExperience) || 0,
        practiceAreas,
        professionalVerified: false,
      }),

      ...(role === "mediator" && {
        mediationNumber: normalizedMac,
        mediatorProfession,
        mediationSpecialties,
        mediationStyle: mediationStyle || "facilitative",
        mediationFeeRange: mediationFeeRange || { min: 0, max: 0, currency: "KES" },
        professionalVerified: false,
      }),
    });

    // ---- Send admin verification email (advocates & mediators only) ----
    if (role === "advocate" || role === "mediator") {
      const verToken = makeVerificationToken(user._id);
      const base = process.env.BACKEND_URL || "http://localhost:5000";
      const approveUrl = `${base}/api/auth/verify/approve?token=${verToken}`;
      const rejectUrl  = `${base}/api/auth/verify/reject?token=${verToken}`;

      sendVerificationRequestEmail({ applicant: user, approveUrl, rejectUrl })
        .catch((err) => console.error("[auth] Verification email failed:", err));
    }

    const token = signToken(user);
    res.status(201).json({ token, user });
  } catch (err) {
    console.error("[POST /api/auth/register]", err);
    res.status(500).json({ error: "Could not create account" });
  }
});

// ============================================================
// POST /api/auth/login
// ============================================================
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(401).json({ error: "Invalid email or password" });

    const valid = await comparePassword(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: "Invalid email or password" });

    const token = signToken(user);
    res.json({ token, user });
  } catch (err) {
    console.error("[POST /api/auth/login]", err);
    res.status(500).json({ error: "Could not log in" });
  }
});

// ============================================================
// GET /api/auth/me
// ============================================================
router.get("/me", requireAuth, async (req, res) => {
  res.json({ user: req.user });
});

// ============================================================
// PATCH /api/auth/me
// ============================================================
router.patch("/me", requireAuth, async (req, res) => {
  try {
    const {
      name,
      preferredLanguage,
      emailNotificationsEnabled,
      bio,
      phone,

      // Advocate fields
      practiceAreas,
      yearsOfExperience,
      barNumber,
      lawFirm,

      // Mediator fields
      mediatorProfession,
      mediationSpecialties,
      mediationStyle,
      mediationFeeRange,
    } = req.body;

    // ---- Base ----
    if (name !== undefined) {
      if (!name.trim()) return res.status(400).json({ error: "name cannot be empty" });
      req.user.name = name.trim();
    }
    if (preferredLanguage !== undefined) {
      if (!["en", "sw"].includes(preferredLanguage)) {
        return res.status(400).json({ error: "preferredLanguage must be 'en' or 'sw'" });
      }
      req.user.preferredLanguage = preferredLanguage;
    }
    if (emailNotificationsEnabled !== undefined) {
      req.user.emailNotificationsEnabled = !!emailNotificationsEnabled;
    }
    if (phone !== undefined) {
      req.user.phone = phone;
    }
    if (bio !== undefined) {
      if (bio.length > 1000) return res.status(400).json({ error: "bio must be 1000 characters or fewer" });
      req.user.bio = bio;
    }

    // ---- Advocate-only ----
    if (req.user.role === "advocate") {
      if (practiceAreas !== undefined) {
        if (!Array.isArray(practiceAreas)) {
          return res.status(400).json({ error: "practiceAreas must be an array" });
        }
        req.user.practiceAreas = practiceAreas;
      }
      if (yearsOfExperience !== undefined) {
        if (yearsOfExperience !== null && (yearsOfExperience < 0 || yearsOfExperience > 70)) {
          return res.status(400).json({ error: "yearsOfExperience must be between 0 and 70" });
        }
        req.user.yearsOfExperience = yearsOfExperience;
      }
      if (lawFirm !== undefined) {
        req.user.lawFirm = lawFirm;
      }
      if (barNumber !== undefined && barNumber !== req.user.barNumber) {
        if (!isValidBarNumber(barNumber)) {
          return res.status(400).json({ error: "Invalid bar number format. Use LSK/YYYY/NNNNN." });
        }
        const normalized = normalizeBarNumber(barNumber);
        const dupe = await User.findOne({ barNumber: normalized, _id: { $ne: req.user._id } });
        if (dupe) return res.status(409).json({ error: "This bar number is already registered" });
        req.user.barNumber = normalized;
        req.user.professionalVerified = false;
      }
    }

    // ---- Mediator-only ----
    if (req.user.role === "mediator") {
      if (mediatorProfession !== undefined) {
        req.user.mediatorProfession = mediatorProfession;
      }
      if (mediationSpecialties !== undefined) {
        if (!Array.isArray(mediationSpecialties)) {
          return res.status(400).json({ error: "mediationSpecialties must be an array" });
        }
        req.user.mediationSpecialties = mediationSpecialties;
      }
      if (mediationStyle !== undefined) {
        if (!["facilitative", "evaluative", "transformative", "mixed"].includes(mediationStyle)) {
          return res.status(400).json({ error: "Invalid mediationStyle" });
        }
        req.user.mediationStyle = mediationStyle;
      }
      if (mediationFeeRange !== undefined) {
        req.user.mediationFeeRange = mediationFeeRange;
      }
      if (mediationNumber !== undefined && mediationNumber !== req.user.mediationNumber) {
        if (!isValidMediationNumber(mediationNumber)) {
          return res.status(400).json({ error: "Invalid MAC number format. Use MAC/YYYY/NNNN." });
        }
        const normalized = normalizeMediationNumber(mediationNumber);
        const dupe = await User.findOne({ mediationNumber: normalized, _id: { $ne: req.user._id } });
        if (dupe) return res.status(409).json({ error: "This MAC number is already registered" });
        req.user.mediationNumber = normalized;
        req.user.professionalVerified = false;
      }
    }

    await req.user.save();
    res.json({ user: req.user });
  } catch (err) {
    console.error("[PATCH /api/auth/me]", err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// PATCH /api/auth/password
// ============================================================
router.patch("/password", requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "currentPassword and newPassword are required" });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ error: "New password must be at least 8 characters" });
    }

    const valid = await comparePassword(currentPassword, req.user.passwordHash);
    if (!valid) return res.status(401).json({ error: "Current password is incorrect" });

    req.user.passwordHash = await hashPassword(newPassword);
    await req.user.save();
    res.json({ ok: true });
  } catch (err) {
    console.error("[PATCH /api/auth/password]", err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// GET /api/auth/verify/approve?token=...
// ============================================================
router.get("/verify/approve", async (req, res) => {
  try {
    const payload = verifyVerificationToken(req.query.token || "");
    if (!payload) return res.status(400).send(confirmPage("Invalid or expired link", "#991b1b"));

    const user = await User.findById(payload.userId);
    if (!user) return res.status(404).send(confirmPage("Applicant not found", "#991b1b"));

    if (user.professionalVerified) {
      return res.send(confirmPage(
        `${user.name} was already verified on ${user.verifiedAt ? new Date(user.verifiedAt).toLocaleString() : "an earlier date"}.`,
        "#065f46"
      ));
    }

    user.professionalVerified = true;
    user.verifiedAt = new Date();
    await user.save();

    sendVerificationResultEmail({ applicant: user, approved: true })
      .catch((err) => console.error("[auth] Result email failed:", err));

    res.send(confirmPage(`✓ Verified: ${user.name} (${user.role})`, "#065f46"));
  } catch (err) {
    console.error("[GET /api/auth/verify/approve]", err);
    res.status(500).send(confirmPage("Server error", "#991b1b"));
  }
});

// ============================================================
// GET /api/auth/verify/reject?token=...
// ============================================================
router.get("/verify/reject", async (req, res) => {
  try {
    const payload = verifyVerificationToken(req.query.token || "");
    if (!payload) return res.status(400).send(confirmPage("Invalid or expired link", "#991b1b"));

    const user = await User.findById(payload.userId);
    if (!user) return res.status(404).send(confirmPage("Applicant not found", "#991b1b"));

    const reason = (req.query.reason || "").toString().slice(0, 500);

    user.professionalVerified = false;
    user.verificationNotes = reason;
    await user.save();

    sendVerificationResultEmail({ applicant: user, approved: false, reason })
      .catch((err) => console.error("[auth] Result email failed:", err));

    res.send(confirmPage(`✗ Rejected: ${user.name} (${user.role})`, "#991b1b"));
  } catch (err) {
    console.error("[GET /api/auth/verify/reject]", err);
    res.status(500).send(confirmPage("Server error", "#991b1b"));
  }
});

// ============================================================
// DELETE /api/auth/me — permanently delete the account
// ============================================================
router.delete("/me", requireAuth, async (req, res) => {
  try {
    const { password } = req.body || {};

    if (!password) {
      return res.status(400).json({ error: "Password is required to delete your account." });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: "Account not found." });
    }

    const valid = await comparePassword(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: "Incorrect password." });
    }

    const userId = user._id;

    // 1. Collect documents before deleting rows
    const docs = await Document.find({
      $or: [
        { advocateId: userId },
        { clientId: userId },
        { uploadedBy: userId },
      ],
    }).select("storedFileName");

    // 2. Cascade delete — leaves → roots
    await Message.deleteMany({
      $or: [
        { advocateId: userId },
        { clientId: userId },
        { senderId: userId },
      ],
    });

    await Review.deleteMany({
      $or: [
        { advocateId: userId },
        { clientId: userId },
      ],
    });

    await Document.deleteMany({
      $or: [
        { advocateId: userId },
        { clientId: userId },
        { uploadedBy: userId },
      ],
    });

    await Case.deleteMany({
      $or: [
        { advocateId: userId },
        { clientId: userId },
      ],
    });

    await ConsultationRequest.deleteMany({
      $or: [
        { advocateId: userId },
        { clientId: userId },
      ],
    });

    // 3. Delete files from disk
    let filesDeleted = 0;
    let filesFailed = 0;

    for (const doc of docs) {
      if (!doc.storedFileName) continue;
      const filePath = path.join(UPLOADS_DIR, doc.storedFileName);
      try {
        await fs.unlink(filePath);
        filesDeleted++;
      } catch (err) {
        if (err.code !== "ENOENT") {
          console.warn(`[DELETE /api/auth/me] Could not delete file ${doc.storedFileName}:`, err.message);
          filesFailed++;
        }
      }
    }

    // 4. Delete the user
    await User.findByIdAndDelete(userId);

    console.log(
      `[DELETE /api/auth/me] Deleted user ${userId} ` +
      `(docs: ${docs.length}, files removed: ${filesDeleted}, file errors: ${filesFailed})`
    );

    res.json({
      ok: true,
      message: "Account deleted.",
      deletedFiles: filesDeleted,
    });
  } catch (err) {
    console.error("[DELETE /api/auth/me]", err);
    res.status(500).json({ error: "Could not delete account" });
  }
});

// Small HTML helper for the confirmation page the admin lands on after clicking a link.
function confirmPage(message, color) {
  return `
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8"/>
        <title>Katiba AI - Verification</title>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
      </head>
      <body style="font-family:Inter,system-ui,sans-serif;background:#f9fafb;margin:0;
                   display:flex;align-items:center;justify-content:center;min-height:100vh;">
        <div style="background:#fff;border:1px solid #e5e7eb;border-radius:16px;
                    padding:32px 40px;max-width:480px;text-align:center;
                    box-shadow:0 1px 3px rgba(0,0,0,0.04);">
          <h1 style="color:${color};margin:0 0 8px;font-size:20px;">${message}</h1>
          <p style="color:#6b7280;margin:0;">You may close this tab.</p>
        </div>
      </body>
    </html>
  `;
}

export default router;