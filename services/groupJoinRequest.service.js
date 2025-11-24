const GroupJoinRequest = require("../models/groupJoinRequest.model");
const { addMemberToGroupService } = require("./group.service");
const { logServiceExecution } = require("../utils/loggerWrapper");

// Create a join request
const createJoinRequestService = logServiceExecution(
  "GroupJoinRequestService",
  "createJoinRequestService",
  async (userId, groupId) => {
    // Check if pending request already exists
    const existingRequest = await getPendingRequestService(userId, groupId);
    
    if (existingRequest) {
      throw new Error("A pending join request already exists");
    }
    
    return await GroupJoinRequest.create({
      user: userId,
      group: groupId,
      status: "pending",
    });
  },
  {
    logResult: true,
    resultFormatter: (result) => `Request created: ${result._id}`,
  }
);

// Get join requests for a group by status
const getGroupJoinRequestsService = logServiceExecution(
  "GroupJoinRequestService",
  "getGroupJoinRequestsService",
  async (groupId, status = "pending") => {
    return await GroupJoinRequest.find({ group: groupId, status })
      .populate("user", "username email profileImage")
      .sort({ requestedAt: 1 }) // Oldest first
      .lean();
  },
  {
    logResult: true,
    resultFormatter: (result) => `Request count: ${result.length}`,
  }
);

// Approve a join request
const approveJoinRequestService = logServiceExecution(
  "GroupJoinRequestService",
  "approveJoinRequestService",
  async (requestId, ownerId) => {
    const request = await GroupJoinRequest.findById(requestId).populate("group");
    
    if (!request) {
      throw new Error("Join request not found");
    }
    
    if (request.status !== "pending") {
      throw new Error("Request has already been processed");
    }
    
    // Add user to group
    await addMemberToGroupService(request.group._id, request.user);
    
    // Update request status
    request.status = "approved";
    request.processedAt = Date.now();
    request.processedBy = ownerId;
    await request.save();
    
    return request;
  },
  {
    logResult: true,
    resultFormatter: (result) => `Request approved: ${result._id}`,
  }
);

// Decline a join request
const declineJoinRequestService = logServiceExecution(
  "GroupJoinRequestService",
  "declineJoinRequestService",
  async (requestId, ownerId) => {
    const request = await GroupJoinRequest.findById(requestId);
    
    if (!request) {
      throw new Error("Join request not found");
    }
    
    if (request.status !== "pending") {
      throw new Error("Request has already been processed");
    }
    
    // Update request status
    request.status = "declined";
    request.processedAt = Date.now();
    request.processedBy = ownerId;
    await request.save();
    
    return request;
  },
  {
    logResult: true,
    resultFormatter: (result) => `Request declined: ${result._id}`,
  }
);

// Get pending request for a user and group
const getPendingRequestService = logServiceExecution(
  "GroupJoinRequestService",
  "getPendingRequestService",
  async (userId, groupId) => {
    return await GroupJoinRequest.findOne({
      user: userId,
      group: groupId,
      status: "pending",
    });
  }
);

// Delete a join request
const deleteJoinRequestService = logServiceExecution(
  "GroupJoinRequestService",
  "deleteJoinRequestService",
  async (requestId) => {
    return await GroupJoinRequest.findByIdAndDelete(requestId);
  },
  {
    logResult: true,
    resultFormatter: (result) => `Request deleted: ${result?._id || requestId}`,
  }
);

module.exports = {
  createJoinRequestService,
  getGroupJoinRequestsService,
  approveJoinRequestService,
  declineJoinRequestService,
  getPendingRequestService,
  deleteJoinRequestService,
};
