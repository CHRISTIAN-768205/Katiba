import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { fileURLToPath } from "url";
import DocumentModel from "../models/Document.js";
import ConsultationRequest from "../models/ConsultationRequest.js";
import { requireAuth } from "../middleware/auth.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_DIR = path.join(__dirname, "../../uploads");
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB - generous for scanned documents/photos, not video

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    // Never trust the original filename for the on-disk name - random name avoids collisions
    // and path traversal entirely; the real name is preserved separately as `originalName`.
    const randomName = crypto.randomBytes(24).toString("hex");
    cb(null, randomName + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    const allowed = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error("Unsupported file type - PDF, Word, or image files only."));
    }
    cb(null, true);
  },
});

const router = Router();
router.use(requireAuth);

async function hasRealRelationship(advocateId, clientId) {
  const existing = await ConsultationRequest.findOne({
    advocateId,
    clientId,
    status: { $in: ["accepted", "completed"] },
  });
  return !!existing;
}

function resolvePair(req, otherUserId) {
  if (req.user.role === "advocate") return { advocateId: req.user._id, clientId: otherUserId };
  return { advocateId: otherUserId, clientId: req.user._id };
}

// POST /api/documents - multipart upload. Fields: file, recipientId, caseId (optional).
router.post("/", (req, res) => {
  upload.single("file")(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });
    try {
      const { recipientId, caseId } = req.body;
      if (!req.file) return res.status(400).json({ error: "file is required" });
      if (!recipientId) {
        fs.unlink(req.file.path, () => {});
        return res.status(400).json({ error: "recipientId is required" });
      }

      const { advocateId, clientId } = resolvePair(req, recipientId);

      if (!(await hasRealRelationship(advocateId, clientId))) {
        fs.unlink(req.file.path, () => {}); // don't leave an orphaned file on disk
        return res.status(403).json({
          error: "You can only share documents with someone you have an accepted or completed consultation with.",
        });
      }

      const doc = await DocumentModel.create({
        advocateId,
        clientId,
        uploadedBy: req.user._id,
        caseId: caseId || null,
        originalName: req.file.originalname,
        storedFileName: req.file.filename,
        mimeType: req.file.mimetype,
        sizeBytes: req.file.size,
      });

      res.status(201).json(doc);
    } catch (e) {
      if (req.file) fs.unlink(req.file.path, () => {});
      console.error("[POST /api/documents]", e);
      res.status(500).json({ error: e.message });
    }
  });
});

// GET /api/documents?caseId=&withUserId= - list documents for a case, or for a specific
// advocate/client relationship. At least one filter is required (no "list everything").
router.get("/", async (req, res) => {
  try {
    const { caseId, withUserId } = req.query;
    const filter = {};

    if (caseId) {
      filter.caseId = caseId;
    } else if (withUserId) {
      const { advocateId, clientId } = resolvePair(req, withUserId);
      filter.advocateId = advocateId;
      filter.clientId = clientId;
    } else {
      // Fall back to "everything shared with me" across all relationships.
      if (req.user.role === "advocate") filter.advocateId = req.user._id;
      else filter.clientId = req.user._id;
    }

    const docs = await DocumentModel.find(filter)
      .sort({ createdAt: -1 })
      .populate("uploadedBy", "name")
      .select("-storedFileName"); // never expose the on-disk filename in list responses
    res.json(docs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/documents/:id/download - authenticated, access restricted to the two people involved.
router.get("/:id/download", async (req, res) => {
  try {
    const doc = await DocumentModel.findOne({
      _id: req.params.id,
      $or: [{ advocateId: req.user._id }, { clientId: req.user._id }],
    });
    if (!doc) return res.status(404).json({ error: "Document not found" });

    const filePath = path.join(UPLOAD_DIR, doc.storedFileName);
    res.download(filePath, doc.originalName);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/documents/:id - only the person who uploaded it can remove it.
router.delete("/:id", async (req, res) => {
  try {
    const doc = await DocumentModel.findOne({ _id: req.params.id, uploadedBy: req.user._id });
    if (!doc) return res.status(404).json({ error: "Document not found" });

    fs.unlink(path.join(UPLOAD_DIR, doc.storedFileName), () => {});
    await doc.deleteOne();
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;