const Group = require("../models/group.model");
const GroupMemberHistory = require("../models/groupMemberHistory.model");
const { logServiceExecution } = require("../utils/loggerWrapper");

// Create a new group
const createGroupService = logServiceExecution(
  "GroupService",
  "createGroupService",
  async (payload) => {
    const group = await Group.create(payload);
    
    // Record the owner joining as the first member
    await recordMemberActionService(
      payload.owner,
      group._id,
      "joined",
      payload.owner
    );
    
    return group;
  },
  {
    logResult: true,
    resultFormatter: (result) => `Group created: ${result._id}`,
  }
);

// Find group by ID with optional population
const findGroupByIdService = logServiceExecution(
  "GroupService",
  "findGroupByIdService",
  async (groupId, populateOptions = null) => {
    let query = Group.findById(groupId);
    
    if (populateOptions) {
      query = query.populate(populateOptions);
    }
    
    return await query;
  }
);

// Update group
const updateGroupService = logServiceExecution(
  "GroupService",
  "updateGroupService",
  async (groupId, payload) => {
    return await Group.findByIdAndUpdate(groupId, payload, { new: true });
  },
  {
    logResult: true,
    resultFormatter: (result) => `Group updated: ${result._id}`,
  }
);

// Delete group
const deleteGroupService = logServiceExecution(
  "GroupService",
  "deleteGroupService",
  async (groupId) => {
    return await Group.findByIdAndDelete(groupId);
  },
  {
    logResult: true,
    resultFormatter: (result) => `Group deleted: ${result?._id || groupId}`,
  }
);

// Get all groups user is a member of
const getUserGroupsService = logServiceExecution(
  "GroupService",
  "getUserGroupsService",
  async (userId) => {
    return await Group.find({ members: userId })
      .populate("owner", "username email profileImage")
      .select("name type owner members maxMembers createdAt")
      .lean();
  },
  {
    logResult: true,
    resultFormatter: (result) => `Group count: ${result.length}`,
  }
);

// Add member to group
const addMemberToGroupService = logServiceExecution(
  "GroupService",
  "addMemberToGroupService",
  async (groupId, userId) => {
    const group = await Group.findByIdAndUpdate(
      groupId,
      { $addToSet: { members: userId } },
      { new: true }
    );
    
    // Record the join action
    await recordMemberActionService(userId, groupId, "joined", userId);
    
    return group;
  },
  {
    logResult: true,
    resultFormatter: (result) => `Member added to group: ${result._id}`,
  }
);

// Remove member from group
const removeMemberFromGroupService = logServiceExecution(
  "GroupService",
  "removeMemberFromGroupService",
  async (groupId, userId) => {
    const group = await Group.findByIdAndUpdate(
      groupId,
      { $pull: { members: userId } },
      { new: true }
    );
    
    // Record the leave action
    await recordMemberActionService(userId, groupId, "left", userId);
    
    return group;
  },
  {
    logResult: true,
    resultFormatter: (result) => `Member removed from group: ${result._id}`,
  }
);

// Ban member from group
const banMemberFromGroupService = logServiceExecution(
  "GroupService",
  "banMemberFromGroupService",
  async (groupId, userId, performedBy) => {
    const group = await Group.findByIdAndUpdate(
      groupId,
      {
        $pull: { members: userId },
        $addToSet: { bannedUsers: userId },
      },
      { new: true }
    );
    
    // Record the banishment action
    await recordMemberActionService(userId, groupId, "banished", performedBy);
    
    return group;
  },
  {
    logResult: true,
    resultFormatter: (result) => `Member banned from group: ${result._id}`,
  }
);

// Transfer ownership
const transferOwnershipService = logServiceExecution(
  "GroupService",
  "transferOwnershipService",
  async (groupId, newOwnerId, currentOwnerId) => {
    const group = await Group.findById(groupId);
    
    if (!group) {
      throw new Error("Group not found");
    }
    
    // Verify new owner is a member
    if (!group.isMember(newOwnerId)) {
      throw new Error("New owner must be a member of the group");
    }
    
    // Update owner
    group.owner = newOwnerId;
    await group.save();
    
    return group;
  },
  {
    logResult: true,
    resultFormatter: (result) => `Ownership transferred for group: ${result._id}`,
  }
);

// Check if user can join group (comprehensive check)
const checkUserCanJoinService = logServiceExecution(
  "GroupService",
  "checkUserCanJoinService",
  async (groupId, userId) => {
    const group = await Group.findById(groupId);
    
    if (!group) {
      throw new Error("Group not found");
    }
    
    return group.canUserJoin(userId);
  },
  {
    logResult: true,
    resultFormatter: (result) => `Can join: ${result}`,
  }
);

// Check cooldown period for private groups (48 hours)
// Applies to users who left or were banished
const checkCooldownPeriodService = logServiceExecution(
  "GroupService",
  "checkCooldownPeriodService",
  async (groupId, userId) => {
    const group = await Group.findById(groupId);
    
    if (!group) {
      throw new Error("Group not found");
    }
    
    // Cooldown only applies to private groups
    if (group.type !== "private") {
      return { inCooldown: false, remainingTime: 0 };
    }
    
    // Get last leave or banish timestamp
    const lastAction = await getLastLeaveTimestampService(userId, groupId);
    
    if (!lastAction) {
      return { inCooldown: false, remainingTime: 0 };
    }
    
    // Check if 48 hours have passed since last action (left or banished)
    const cooldownPeriod = 48 * 60 * 60 * 1000; // 48 hours in milliseconds
    const timeSinceAction = Date.now() - lastAction.getTime();
    
    if (timeSinceAction < cooldownPeriod) {
      const remainingTime = cooldownPeriod - timeSinceAction;
      return { inCooldown: true, remainingTime };
    }
    
    return { inCooldown: false, remainingTime: 0 };
  },
  {
    logResult: true,
    resultFormatter: (result) => `Cooldown: ${result.inCooldown}, Remaining: ${result.remainingTime}ms`,
  }
);

// Check if group has capacity for new members
const checkGroupCapacityService = logServiceExecution(
  "GroupService",
  "checkGroupCapacityService",
  async (groupId) => {
    const group = await Group.findById(groupId);
    
    if (!group) {
      throw new Error("Group not found");
    }
    
    return group.hasCapacity();
  },
  {
    logResult: true,
    resultFormatter: (result) => `Has capacity: ${result}`,
  }
);

// Record member action (join, leave, banish)
const recordMemberActionService = logServiceExecution(
  "GroupService",
  "recordMemberActionService",
  async (userId, groupId, action, performedBy) => {
    return await GroupMemberHistory.create({
      user: userId,
      group: groupId,
      action,
      performedBy,
    });
  },
  {
    logResult: true,
    resultFormatter: (result) => `Action recorded: ${result.action}`,
  }
);

// Get last leave or banish timestamp for cooldown check
const getLastLeaveTimestampService = logServiceExecution(
  "GroupService",
  "getLastLeaveTimestampService",
  async (userId, groupId) => {
    // Check for both "left" and "banished" actions
    const lastAction = await GroupMemberHistory.findOne({
      user: userId,
      group: groupId,
      action: { $in: ["left", "banished"] },
    })
      .sort({ timestamp: -1 })
      .select("timestamp");
    
    return lastAction ? lastAction.timestamp : null;
  }
);

module.exports = {
  createGroupService,
  findGroupByIdService,
  updateGroupService,
  deleteGroupService,
  getUserGroupsService,
  addMemberToGroupService,
  removeMemberFromGroupService,
  banMemberFromGroupService,
  transferOwnershipService,
  checkUserCanJoinService,
  checkCooldownPeriodService,
  checkGroupCapacityService,
  recordMemberActionService,
  getLastLeaveTimestampService,
};
