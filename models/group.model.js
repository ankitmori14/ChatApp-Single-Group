const mongoose = require("mongoose");

const groupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 50,
    },
    type: {
      type: String,
      required: true,
      enum: ["private", "open"],
      lowercase: true,
    },
    owner: {
      type: mongoose.Schema.ObjectId,
      ref: "user",
      required: true,
    },
    members: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "user",
      },
    ],
    bannedUsers: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "user",
      },
    ],
    maxMembers: {
      type: Number,
      default: null, // null means unlimited
      min: 2,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
groupSchema.index({ owner: 1 });
groupSchema.index({ members: 1 });
groupSchema.index({ type: 1 });

// Instance method: Check if user is a member
groupSchema.methods.isMember = function (userId) {
  return this.members.some(
    (memberId) => memberId.toString() === userId.toString()
  );
};

// Instance method: Check if user is the owner
groupSchema.methods.isOwner = function (userId) {
  return this.owner.toString() === userId.toString();
};

// Instance method: Check if user is banned
groupSchema.methods.isBanned = function (userId) {
  return this.bannedUsers.some(
    (bannedId) => bannedId.toString() === userId.toString()
  );
};

// Instance method: Check if group has capacity for new members
groupSchema.methods.hasCapacity = function () {
  if (this.maxMembers === null) {
    return true; // Unlimited capacity
  }
  return this.members.length < this.maxMembers;
};

// Instance method: Comprehensive check if user can join
groupSchema.methods.canUserJoin = function (userId) {
  // Check if already a member
  if (this.isMember(userId)) {
    return { canJoin: false, reason: "Already a member" };
  }

  // Check if banned
  if (this.isBanned(userId)) {
    return { canJoin: false, reason: "User is banned" };
  }

  // Check capacity
  if (!this.hasCapacity()) {
    return { canJoin: false, reason: "Group is at maximum capacity" };
  }

  return { canJoin: true, reason: null };
};

// Pre-save hook for validation
groupSchema.pre("save", function (next) {
  // Ensure owner is in members array
  if (this.isNew && !this.isMember(this.owner)) {
    this.members.push(this.owner);
  }

  // Validate maxMembers if set
  if (this.maxMembers !== null && this.maxMembers < 2) {
    return next(new Error("Maximum members must be at least 2"));
  }

  next();
});

const Group = mongoose.model("Group", groupSchema, "group");
module.exports = Group;
