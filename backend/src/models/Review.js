import mongoose from "mongoose";

const ReviewSchema = new mongoose.Schema(
  {
    advocateId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    // Ties the review to one specific completed consultation - the unique index below is what
    // actually enforces "one review per consultation", not just app-level validation.
    requestId: { type: mongoose.Schema.Types.ObjectId, ref: "ConsultationRequest", required: true, unique: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.models.Review ||
  mongoose.model("Review", ReviewSchema)    