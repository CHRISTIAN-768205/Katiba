import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema(
  {
    advocateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
    readAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

MessageSchema.index({
  advocateId: 1,
  clientId: 1,
  createdAt: 1,
});

const Message =
  mongoose.models.Message ||
  mongoose.model("Message", MessageSchema);

export default Message;