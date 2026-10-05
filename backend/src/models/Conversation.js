import mongoose from "mongoose";

// ============================================================
//  MESSAGE SCHEMA – embedded messages inside a Conversation
//  NOTE: registered as "ConversationMessage" to avoid collision
//        with the standalone Message model in Message.js
// ============================================================
const MessageSchema = new mongoose.Schema(
  {
    // --- For AI Chat (user/assistant) ---
    role: {
      type: String,
      enum: ["user", "assistant", "sender", "receiver"],
      required: false,
    },
    text: {
      type: String,
      required: true,
    },

    // --- For Human Messaging ---
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
      index: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
      index: true,
    },
    read: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
      default: null,
    },

    // --- AI-specific fields ---
    urgency: {
      type: String,
      enum: ["normal", "immediate"],
      default: "normal",
    },
    citedArticles: [
      {
        articleId: { type: mongoose.Schema.Types.ObjectId, ref: "Article" },
        lawSource: String,
        chapterNumber: Number,
        articleNumber: Number,
        articleTitle: String,
      },
    ],

    // --- Human messaging attachments ---
    attachments: [
      {
        name: { type: String, required: true },
        url: { type: String, required: true },
        type: { type: String, enum: ["image", "document", "other"], default: "document" },
        size: { type: Number },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],

    // --- Soft delete for human messages ---
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// ============================================================
//  CONVERSATION SCHEMA – supports both AI and human conversations
// ============================================================
const ConversationSchema = new mongoose.Schema(
  {
    // --- Type of conversation ---
    type: {
      type: String,
      enum: ["ai_chat", "human_chat"],
      default: "ai_chat",
      index: true,
    },

    // --- AI Chat specific ---
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
      index: true,
    },
    title: {
      type: String,
      required: function () {
        // Title is required for AI chats, optional for human chats
        return this.type === "ai_chat";
      },
    },
    language: {
      type: String,
      enum: ["en", "sw"],
      default: "en",
    },

    // --- Human Chat specific (advocate-client messaging) ---
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: false,
      },
    ],
    caseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Case",
      default: null,
    },
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ConversationMessage", // ← renamed to match the model below
      default: null,
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
    unreadCount: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },

    // --- Shared fields ---
    messages: [MessageSchema],
  },
  { timestamps: true }
);

// Indexes for performance
ConversationSchema.index({ participants: 1 }, { unique: false });
ConversationSchema.index({ userId: 1, type: 1 });
ConversationSchema.index({ type: 1, updatedAt: -1 });

// Virtual for human conversations - get other participant
ConversationSchema.virtual("otherParticipant").get(function () {
  if (this.type !== "human_chat" || !this.participants || !this._id) return null;
  // This will be populated by the controller
  return null;
});

// Ensure virtuals are included in toJSON output
ConversationSchema.set("toJSON", { virtuals: true });
ConversationSchema.set("toObject", { virtuals: true });

// ============================================================
//  Model registration — idempotent to survive repeated imports
// ============================================================

const Conversation =
  mongoose.models.Conversation ||
  mongoose.model("Conversation", ConversationSchema);

// Renamed from "Message" → "ConversationMessage" to avoid collision
// with the standalone Message model in src/models/Message.js
const ConversationMessage =
  mongoose.models.ConversationMessage ||
  mongoose.model("ConversationMessage", MessageSchema);

export { Conversation, ConversationMessage };
export default Conversation;