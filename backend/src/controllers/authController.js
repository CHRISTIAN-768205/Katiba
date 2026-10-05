// backend/controllers/authController.js

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import {
  isValidBarNumber,
  normalizeBarNumber,
} from "../utils/validateBarNumber.js";
import {
  isValidMediationNumber,
  normalizeMediationNumber,
} from "../utils/validateMediationNumber.js";

const generateToken = (user) =>
  jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

// ============================================================
// POST /api/auth/register
// ============================================================
export async function register(req, res) {
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
    } = req.body;

    // ---- Base validation ----
    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email and password are required." });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters." });
    }
    if (!["citizen", "advocate", "mediator"].includes(role)) {
      return res.status(400).json({ error: "Invalid role." });
    }

    // ---- Duplicate email check ----
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ error: "An account with this email already exists." });
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
        return res.status(400).json({ error: "This bar number is already registered." });
      }

      if (!lawFirm || !practiceAreas?.length) {
        return res.status(400).json({
          error: "Law firm and at least one practice area are required for advocates.",
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
        return res.status(400).json({ error: "This MAC number is already registered." });
      }

      if (!mediatorProfession || !mediationSpecialties?.length) {
        return res.status(400).json({
          error: "Profession and at least one specialty are required for mediators.",
        });
      }
    }

    // ---- Hash password ----
    const passwordHash = await bcrypt.hash(password, 10);

    // ---- Create the user ----
    const user = new User({
      name,
      email,
      passwordHash,
      role,
      phone: phone || null,
      bio: bio || "",

      // Advocates start unverified - admin must approve against LSK Roll.
      ...(role === "advocate" && {
        barNumber: normalizedBar,
        lawFirm,
        yearsOfExperience: Number(yearsOfExperience) || 0,
        practiceAreas,
        professionalVerified: false,
      }),

      // Mediators start unverified - admin must approve against MAC register.
      ...(role === "mediator" && {
        mediationNumber: normalizedMac,
        mediatorProfession,
        mediationSpecialties,
        mediationStyle: mediationStyle || "facilitative",
        mediationFeeRange: mediationFeeRange || { min: 0, max: 0, currency: "KES" },
        professionalVerified: false,
      }),
    });

    await user.save();

    const token = generateToken(user);

    return res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        professionalVerified: user.professionalVerified,
        barNumber: user.barNumber,
        mediationNumber: user.mediationNumber,
      },
    });
  } catch (err) {
    console.error("Register error:", err);
    return res.status(500).json({ error: "Registration failed." });
  }
}

// ============================================================
// POST /api/auth/login
// ============================================================
export async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    const token = generateToken(user);

    return res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        professionalVerified: user.professionalVerified,
        preferredLanguage: user.preferredLanguage,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ error: "Login failed." });
  }
}

// ============================================================
// GET /api/auth/me
// ============================================================
export async function getMe(req, res) {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found." });
    return res.json({ user });
  } catch (err) {
    console.error("getMe error:", err);
    return res.status(500).json({ error: "Failed to load profile." });
  }
}

// ============================================================
// PATCH /api/auth/me
// ============================================================
export async function updateProfile(req, res) {
  try {
    const allowed = ["name", "preferredLanguage", "emailNotificationsEnabled", "phone", "bio"];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true });
    return res.json({ user });
  } catch (err) {
    console.error("updateProfile error:", err);
    return res.status(500).json({ error: "Failed to update profile." });
  }
}

// ============================================================
// PATCH /api/auth/password
// ============================================================
export async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Current and new password are required." });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ error: "New password must be at least 8 characters." });
    }

    const user = await User.findById(req.user.id);
    const ok = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ error: "Current password is incorrect." });
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await user.save();

    return res.json({ message: "Password updated successfully." });
  } catch (err) {
    console.error("changePassword error:", err);
    return res.status(500).json({ error: "Failed to change password." });
  }
}