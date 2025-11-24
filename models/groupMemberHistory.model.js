const mongoose = require("mongoose");

const groupMemberHistorySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: "user",
    required: true,
  },
  group: {
    type: mongoose.Schema.ObjectId,
    ref: "Group",
    required: true,
  },
  action: {
    type: String,
    enum: ["joined", "left", "banished"],
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  performedBy: {
    type: mongoose.Schema.ObjectId,
    ref: "user",
  },
});

// Compound index for cooldown checks and history queries
groupMemberHistorySchema.index({ user: 1, group: 1, action: 1 });

// Index for time-based queries
groupMemberHistorySchema.index({ timestamp: 1 });

const GroupMemberHistory = mongoose.model(
  "GroupMemberHistory",
  groupMemberHistorySchema,
  "groupMemberHistory"
);

module.exports = GroupMemberHistory;
