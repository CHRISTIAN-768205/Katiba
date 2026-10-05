import mongoose from "mongoose";

const CaseNoteSchema = new mongoose.Schema(
  {
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const CaseSchema = new mongoose.Schema(
  {
    advocateId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true },

    // NOTE: This enum MUST stay in sync with PRACTICE_AREAS in
    // frontend/src/pages/Register.jsx (and User.practiceAreas).
    practiceArea: {
      type: String,
      enum: [
        "Criminal Law",
        "Family Law",
        "Land & Property",
        "Employment",
        "Commercial",
        "Constitutional",
        "Human Rights",
        "Immigration",
        "Tax",
        "Environmental",
        "Succession",
        "Banking & Finance",
        "Other",
      ],
      default: "Other",
    },

    description: { type: String, default: "" },

    status: {
      type: String,
      enum: ["open", "in_progress", "closed"],
      default: "open",
      index: true,
    },

    // If this case grew out of a consultation booked through the platform, keep the link -
    // otherwise null (an advocate can also log a case for an existing client directly).
    originatingRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ConsultationRequest",
      default: null,
    },

    notes: [CaseNoteSchema],
    closedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.models.Case ||
  mongoose.model("Case", CaseSchema);