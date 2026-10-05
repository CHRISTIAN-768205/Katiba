import mongoose from "mongoose";

const DocumentSchema = new mongoose.Schema(
  {
    advocateId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    // Optional - a document can be attached to a specific case, or just shared generally.
    caseId: { type: mongoose.Schema.Types.ObjectId, ref: "Case", default: null, index: true },

    originalName: { type: String, required: true },
    storedFileName: { type: String, required: true }, // the random on-disk filename, never exposed directly
    mimeType: { type: String, required: true },
    sizeBytes: { type: Number, required: true },
  },
  { timestamps: true }
);

export default mongoose.models.Document ||
  mongoose.model("Document", DocumentSchema)