import mongoose from "mongoose";

const CalendarEventSchema = new mongoose.Schema(
  {
    requestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ConsultationRequest",
      required: true,
      unique: true, // one confirmed event per request - re-confirming (e.g. after a reschedule) updates it, not duplicates it
    },
    advocateId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    startTime: { type: Date, required: true, index: true },
    endTime: { type: Date, required: true },
    consultationType: { type: String, enum: ["virtual", "physical"], required: true },
    locationOrLink: { type: String, default: null },
    status: { type: String, enum: ["upcoming", "completed", "cancelled"], default: "upcoming", index: true },

    // Set by the reminder scheduler as each reminder goes out, so it never sends the same one twice.
    reminder24hSentAt: { type: Date, default: null },
    reminder1hSentAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.model("CalendarEvent", CalendarEventSchema);