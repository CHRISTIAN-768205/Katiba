import mongoose from "mongoose";

const ConsultationRequestSchema = new mongoose.Schema(
  {
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    advocateId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    message: { type: String, required: true },

    // What the client originally asked for.
    requestedDate: { type: Date, required: true },
    durationMinutes: { type: Number, default: 30, min: 15, max: 240 },
    consultationType: { type: String, enum: ["virtual", "physical"], default: "virtual" },

    // pending -> accepted (direct) | rejected | reschedule_proposed
    // reschedule_proposed -> accepted (client confirms) | rejected (client declines, or advocate withdraws)
    // accepted -> completed | cancelled
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "reschedule_proposed", "completed", "cancelled"],
      default: "pending",
      index: true,
    },

    // Set once a time is actually agreed - either requestedDate (direct accept) or proposedDate
    // (once the client confirms a reschedule). This is what the CalendarEvent gets built from.
    confirmedDate: { type: Date, default: null },

    // Populated only while status === "reschedule_proposed" - the advocate's suggested alternative.
    proposedDate: { type: Date, default: null },
    rescheduleNote: { type: String, default: null },

    rejectionReason: { type: String, default: null },
    // Physical address or virtual meeting link/instructions - set by the advocate on accept.
    locationOrLink: { type: String, default: null },

    // Set exactly once, the first time the advocate takes ANY action on this request (accept,
    // reject, or propose a reschedule) - regardless of what happens afterward. This is what makes
    // "average response time" analytics accurate even for requests that later go through a
    // reschedule round-trip, where `updatedAt` would otherwise keep moving forward.
    firstRespondedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.models.ConsultationRequest ||
  mongoose.model("ConsultationRequest", ConsultationRequestSchema)