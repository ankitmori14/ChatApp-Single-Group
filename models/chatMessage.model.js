const mongoose = require("mongoose");

const chatMessaageSchema = new mongoose.Schema(
  {
    message: {
      type: String,
      trim: true,
      required: true,
    },
    fromUser: {
      type: mongoose.Schema.ObjectId,
      ref: "user",
      required: true,
    },
    toUser: {
      type: mongoose.Schema.ObjectId,
      ref: "user", // Fixed: was "User", now consistent with other refs
    },
    group: {
      type: mongoose.Schema.ObjectId,
      ref: "Group",
    },
    messageType: {
      type: String,
      enum: ["direct", "group"],
      default: "direct",
    },
  },
  { timestamps: true }
);

// Validation: Either toUser OR group must be present, not both
chatMessaageSchema.pre("validate", function (next) {
  if (this.messageType === "direct" && !this.toUser) {
    return next(new Error("toUser is required for direct messages"));
  }
  if (this.messageType === "group" && !this.group) {
    return next(new Error("group is required for group messages"));
  }
  if (this.toUser && this.group) {
    return next(new Error("Message cannot have both toUser and group"));
  }
  next();
});

// Index for group message history
chatMessaageSchema.index({ group: 1, createdAt: 1 });

// Existing indexes for direct messages remain
chatMessaageSchema.index({ fromUser: 1, toUser: 1 });

const ChatMessage = mongoose.model(
  "ChatMessage",
  chatMessaageSchema,
  "chatMessage"
);
module.exports = ChatMessage;
