const mongoose = require("mongoose");

const logSchema = new mongoose.Schema(
  {
    level: {
      type: String,
      required: true,
      enum: ["error", "warn", "info", "debug"],
      index: true,
    },
    message: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    service: {
      type: String,
      index: true,
    },
    function: {
      type: String,
    },
    action: {
      type: String,
      enum: ["START", "END", "ERROR"],
    },
    duration: {
      type: Number, // milliseconds
    },
    params: {
      type: mongoose.Schema.Types.Mixed,
    },
    result: {
      type: String,
    },
    error: {
      message: String,
      stack: String,
    },
    meta: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
    collection: "logs",
  }
);

// Index for efficient querying
logSchema.index({ timestamp: -1 });
logSchema.index({ level: 1, timestamp: -1 });
logSchema.index({ service: 1, timestamp: -1 });

// TTL index to automatically delete logs older than 30 days
logSchema.index({ timestamp: 1 }, { expireAfterSeconds: 2592000 }); // 30 days

const Log = mongoose.model("Log", logSchema);

module.exports = Log;
