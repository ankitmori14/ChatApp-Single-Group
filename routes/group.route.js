const express = require("express");
const {
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
} = require("../controller/group.controller");
const {
  group_validator,
  message_validator,
  groupId_validator,
  member_validator,
  transfer_validator,
  requestId_validator,
} = require("../validation/group.middleware");
const { validatorFunc } = require("../services/bodyvalidator.service");
const authenticate = require("../middleware/authenticate");

const groupRouter = express.Router();

// All routes require authentication
groupRouter.use(authenticate);

// Group management routes
groupRouter.post("/create", group_validator, validatorFunc, createGroup);
groupRouter.get("/my-groups", getUserGroups);
groupRouter.get("/:groupId", getGroupDetails);
groupRouter.get("/:groupId/members", getGroupMembers);
groupRouter.delete("/:groupId", deleteGroup);

// Member operation routes
groupRouter.post("/:groupId/join", joinGroup);
groupRouter.post("/:groupId/leave", leaveGroup);
groupRouter.post("/:groupId/banish", member_validator, validatorFunc, banishMember);
groupRouter.post(
  "/:groupId/transfer",
  transfer_validator,
  validatorFunc,
  transferOwnership
);

// Join request routes (private groups)
groupRouter.get("/:groupId/requests", getJoinRequests);
groupRouter.post(
  "/:groupId/approve",
  requestId_validator,
  validatorFunc,
  approveJoinRequest
);
groupRouter.post(
  "/:groupId/decline",
  requestId_validator,
  validatorFunc,
  declineJoinRequest
);

// Group messaging routes
groupRouter.post(
  "/:groupId/message",
  message_validator,
  validatorFunc,
  sendGroupMessage
);
groupRouter.get("/:groupId/messages", getGroupMessages);

module.exports = groupRouter;
