const sendResponse = require("../services/response.service");
const {
  createGroupService,
  findGroupByIdService,
  deleteGroupService,
  getUserGroupsService,
  addMemberToGroupService,
  removeMemberFromGroupService,
  banMemberFromGroupService,
  transferOwnershipService,
  checkUserCanJoinService,
  checkCooldownPeriodService,
} = require("../services/group.service");
const {
  createJoinRequestService,
  getGroupJoinRequestsService,
  approveJoinRequestService,
  declineJoinRequestService,
} = require("../services/groupJoinRequest.service");
const {
  sendGroupMessageService,
  getGroupMessageHistoryService,
  deleteGroupMessagesService,
} = require("../services/groupMessage.service");

// Create a new group
const createGroup = async (req, res) => {
  try {
    const { name, type, maxMembers } = req.body;
    const userId = req.user._id;

    const groupData = {
      name,
      type: type.toLowerCase(),
      owner: userId,
      maxMembers: maxMembers || null,
    };

    const group = await createGroupService(groupData);

    return sendResponse(res, 201, true, "Group created successfully", group);
  } catch (error) {
    return sendResponse(res, 500, false, "Something went wrong!", {
      message: error.message,
    });
  }
};

// Get user's groups
const getUserGroups = async (req, res) => {
  try {
    const userId = req.user._id;
    const groups = await getUserGroupsService(userId);

    return sendResponse(res, 200, true, "User groups retrieved", groups);
  } catch (error) {
    return sendResponse(res, 500, false, "Something went wrong!", {
      message: error.message,
    });
  }
};

// Get group details
const getGroupDetails = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;

    const group = await findGroupByIdService(groupId, {
      path: "owner",
      select: "username email profileImage",
    });

    if (!group) {
      return sendResponse(res, 404, false, "Group not found", null);
    }

    // Check if user is a member (for private groups)
    if (group.type === "private" && !group.isMember(userId)) {
      return sendResponse(
        res,
        403,
        false,
        "You must be a member to view this group",
        null
      );
    }

    const groupData = {
      ...group.toObject(),
      memberCount: group.members.length,
      isOwner: group.isOwner(userId),
      isMember: group.isMember(userId),
    };

    return sendResponse(res, 200, true, "Group details retrieved", groupData);
  } catch (error) {
    return sendResponse(res, 500, false, "Something went wrong!", {
      message: error.message,
    });
  }
};

// Get group members
const getGroupMembers = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;

    // First, get group without population to check membership
    const group = await findGroupByIdService(groupId);

    if (!group) {
      return sendResponse(res, 404, false, "Group not found", null);
    }

    // Check if user is a member or owner (before population)
    // Owner is automatically a member, but we check both for clarity
    const isOwner = group.isOwner(userId);
    const isMember = group.isMember(userId);
    
    if (!isOwner && !isMember) {
      return sendResponse(
        res,
        403,
        false,
        "Only group members and owner can view members",
        null
      );
    }

    // Now populate members for the response
    await group.populate("members", "username email profileImage isOnline");

    return sendResponse(res, 200, true, "Group members retrieved", group.members);
  } catch (error) {
    return sendResponse(res, 500, false, "Something went wrong!", {
      message: error.message,
    });
  }
};

// Delete group
const deleteGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;

    const group = await findGroupByIdService(groupId);

    if (!group) {
      return sendResponse(res, 404, false, "Group not found", null);
    }

    // Check if user is the owner
    if (!group.isOwner(userId)) {
      return sendResponse(
        res,
        403,
        false,
        "Only the group owner can delete the group",
        null
      );
    }

    // Check if owner is the sole member
    if (group.members.length > 1) {
      return sendResponse(
        res,
        409,
        false,
        "Group can only be deleted when you are the sole member",
        null
      );
    }

    // Delete all group messages
    await deleteGroupMessagesService(groupId);

    // Delete the group
    await deleteGroupService(groupId);

    return sendResponse(res, 200, true, "Group deleted successfully", null);
  } catch (error) {
    return sendResponse(res, 500, false, "Something went wrong!", {
      message: error.message,
    });
  }
};

module.exports = {
  createGroup,
  getUserGroups,
  getGroupDetails,
  getGroupMembers,
  deleteGroup,
};

// Join a group (open) or request to join (private)
const joinGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;

    const group = await findGroupByIdService(groupId);

    if (!group) {
      return sendResponse(res, 404, false, "Group not found", null);
    }

    // Check if user is already a member
    if (group.isMember(userId)) {
      return sendResponse(res, 409, false, "Already a member", null);
    }

    // Check group capacity
    if (!group.hasCapacity()) {
      return sendResponse(res, 409, false, "Group is at maximum capacity", null);
    }

    // Check cooldown period (applies to both left and banished users)
    const cooldown = await checkCooldownPeriodService(groupId, userId);
    if (cooldown.inCooldown) {
      const hoursRemaining = Math.ceil(cooldown.remainingTime / (60 * 60 * 1000));
      return sendResponse(
        res,
        403,
        false,
        `You must wait ${hoursRemaining} hours before requesting to rejoin this group`,
        null
      );
    }

    // For open groups, check if user is banned
    if (group.type === "open") {
      // If user is banned, they need owner approval even for open groups
      if (group.isBanned(userId)) {
        // Create join request for banned users
        await createJoinRequestService(userId, groupId);
        return sendResponse(
          res,
          200,
          true,
          "Join request submitted. Owner approval required due to previous banishment.",
          null
        );
      }
      
      // Not banned, join immediately
      await addMemberToGroupService(groupId, userId);
      return sendResponse(res, 200, true, "Joined group successfully", null);
    }

    // For private groups, create join request (banned or not)
    await createJoinRequestService(userId, groupId);
    return sendResponse(
      res,
      200,
      true,
      "Join request submitted successfully",
      null
    );
  } catch (error) {
    return sendResponse(res, 500, false, "Something went wrong!", {
      message: error.message,
    });
  }
};

// Leave a group
const leaveGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;

    const group = await findGroupByIdService(groupId);

    if (!group) {
      return sendResponse(res, 404, false, "Group not found", null);
    }

    // Check if user is a member
    if (!group.isMember(userId)) {
      return sendResponse(res, 409, false, "You are not a member of this group", null);
    }

    // Check if user is the owner
    if (group.isOwner(userId)) {
      return sendResponse(
        res,
        409,
        false,
        "Owner must transfer ownership before leaving",
        null
      );
    }

    // Remove member
    await removeMemberFromGroupService(groupId, userId);

    return sendResponse(res, 200, true, "Left group successfully", null);
  } catch (error) {
    return sendResponse(res, 500, false, "Something went wrong!", {
      message: error.message,
    });
  }
};

// Banish a member (owner only)
const banishMember = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { userId } = req.body;
    const ownerId = req.user._id;

    const group = await findGroupByIdService(groupId);

    if (!group) {
      return sendResponse(res, 404, false, "Group not found", null);
    }

    // Check if requester is the owner
    if (!group.isOwner(ownerId)) {
      return sendResponse(
        res,
        403,
        false,
        "Only the group owner can banish members",
        null
      );
    }

    // Check if target user is a member
    if (!group.isMember(userId)) {
      return sendResponse(res, 409, false, "User is not a member of this group", null);
    }

    // Prevent owner from banishing themselves
    if (userId.toString() === ownerId.toString()) {
      return sendResponse(res, 409, false, "Owner cannot banish themselves", null);
    }

    // Banish member
    await banMemberFromGroupService(groupId, userId, ownerId);

    return sendResponse(res, 200, true, "Member banished successfully", null);
  } catch (error) {
    return sendResponse(res, 500, false, "Something went wrong!", {
      message: error.message,
    });
  }
};

// Transfer ownership (owner only)
const transferOwnership = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { newOwnerId } = req.body;
    const currentOwnerId = req.user._id;

    const group = await findGroupByIdService(groupId);

    if (!group) {
      return sendResponse(res, 404, false, "Group not found", null);
    }

    // Check if requester is the owner
    if (!group.isOwner(currentOwnerId)) {
      return sendResponse(
        res,
        403,
        false,
        "Only the group owner can transfer ownership",
        null
      );
    }

    // Check if new owner is a member
    if (!group.isMember(newOwnerId)) {
      return sendResponse(
        res,
        409,
        false,
        "New owner must be a member of the group",
        null
      );
    }

    // Transfer ownership
    await transferOwnershipService(groupId, newOwnerId, currentOwnerId);

    return sendResponse(res, 200, true, "Ownership transferred successfully", null);
  } catch (error) {
    return sendResponse(res, 500, false, "Something went wrong!", {
      message: error.message,
    });
  }
};

module.exports = {
  createGroup,
  getUserGroups,
  getGroupDetails,
  getGroupMembers,
  deleteGroup,
  joinGroup,
  leaveGroup,
  banishMember,
  transferOwnership,
};

// Get join requests for a group (owner only)
const getJoinRequests = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;

    const group = await findGroupByIdService(groupId);

    if (!group) {
      return sendResponse(res, 404, false, "Group not found", null);
    }

    // Check if requester is the owner
    if (!group.isOwner(userId)) {
      return sendResponse(
        res,
        403,
        false,
        "Only the group owner can view join requests",
        null
      );
    }

    const requests = await getGroupJoinRequestsService(groupId, "pending");

    return sendResponse(res, 200, true, "Join requests retrieved", requests);
  } catch (error) {
    return sendResponse(res, 500, false, "Something went wrong!", {
      message: error.message,
    });
  }
};

// Approve a join request (owner only)
const approveJoinRequest = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { requestId } = req.body;
    const ownerId = req.user._id;

    const group = await findGroupByIdService(groupId);

    if (!group) {
      return sendResponse(res, 404, false, "Group not found", null);
    }

    // Check if requester is the owner
    if (!group.isOwner(ownerId)) {
      return sendResponse(
        res,
        403,
        false,
        "Only the group owner can approve join requests",
        null
      );
    }

    // Check group capacity
    if (!group.hasCapacity()) {
      return sendResponse(
        res,
        409,
        false,
        "Group has reached maximum member capacity",
        null
      );
    }

    // Approve request
    await approveJoinRequestService(requestId, ownerId);

    return sendResponse(res, 200, true, "Join request approved", null);
  } catch (error) {
    return sendResponse(res, 500, false, "Something went wrong!", {
      message: error.message,
    });
  }
};

// Decline a join request (owner only)
const declineJoinRequest = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { requestId } = req.body;
    const ownerId = req.user._id;

    const group = await findGroupByIdService(groupId);

    if (!group) {
      return sendResponse(res, 404, false, "Group not found", null);
    }

    // Check if requester is the owner
    if (!group.isOwner(ownerId)) {
      return sendResponse(
        res,
        403,
        false,
        "Only the group owner can decline join requests",
        null
      );
    }

    // Decline request
    await declineJoinRequestService(requestId, ownerId);

    return sendResponse(res, 200, true, "Join request declined", null);
  } catch (error) {
    return sendResponse(res, 500, false, "Something went wrong!", {
      message: error.message,
    });
  }
};

module.exports = {
  createGroup,
  getUserGroups,
  getGroupDetails,
  getGroupMembers,
  deleteGroup,
  joinGroup,
  leaveGroup,
  banishMember,
  transferOwnership,
  getJoinRequests,
  approveJoinRequest,
  declineJoinRequest,
};

// Send a message to a group
const sendGroupMessage = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { message } = req.body;
    const userId = req.user._id;

    const group = await findGroupByIdService(groupId);

    if (!group) {
      return sendResponse(res, 404, false, "Group not found", null);
    }

    // Check if user is a member
    if (!group.isMember(userId)) {
      return sendResponse(
        res,
        403,
        false,
        "You must be a member to send messages",
        null
      );
    }

    // Send message
    const groupMessage = await sendGroupMessageService(userId, groupId, message);

    return sendResponse(res, 201, true, "Message sent successfully", groupMessage);
  } catch (error) {
    return sendResponse(res, 500, false, "Something went wrong!", {
      message: error.message,
    });
  }
};

// Get group message history
const getGroupMessages = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;
    const { limit, skip } = req.query;

    const group = await findGroupByIdService(groupId);

    if (!group) {
      return sendResponse(res, 404, false, "Group not found", null);
    }

    // Check if user is a member
    if (!group.isMember(userId)) {
      return sendResponse(
        res,
        403,
        false,
        "You must be a member to view messages",
        null
      );
    }

    // Get messages
    const messages = await getGroupMessageHistoryService(groupId, {
      limit: parseInt(limit) || 50,
      skip: parseInt(skip) || 0,
    });

    return sendResponse(res, 200, true, "Messages retrieved", messages);
  } catch (error) {
    return sendResponse(res, 500, false, "Something went wrong!", {
      message: error.message,
    });
  }
};

module.exports = {
  createGroup,
  getUserGroups,
  getGroupDetails,
  getGroupMembers,
  deleteGroup,
  joinGroup,
  leaveGroup,
  banishMember,
  transferOwnership,
  getJoinRequests,
  approveJoinRequest,
  declineJoinRequest,
  sendGroupMessage,
  getGroupMessages,
};
