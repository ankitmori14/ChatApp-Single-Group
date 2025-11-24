const mongoose = require("mongoose");

const groupJoinRequestSchema = new mongoose.Schema({
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
  status: {
    type: String,
    enum: ["pending", "approved", "declined"],
    default: "pending",
  },
  requestedAt: {
    type: Date,
    default: Date.now,
  },
  processedAt: {
    type: Date,
  },
  processedBy: {
    type: mongoose.Schema.ObjectId,
    ref: "user",
  },
});

// Compound index for fetching pending requests by group
groupJoinRequestSchema.index({ group: 1, status: 1 });

// Compound index for preventing duplicate requests
groupJoinRequestSchema.index({ user: 1, group: 1 });

const GroupJoinRequest = mongoose.model(
  "GroupJoinRequest",
  groupJoinRequestSchema,
  "groupJoinRequest"
);

module.exports = GroupJoinRequest;
