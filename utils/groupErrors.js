// Custom Error Class for Group Operations
class GroupError extends Error {
  constructor(errorType) {
    super(errorType.message);
    this.name = "GroupError";
    this.code = errorType.code;
  }
}

// Error Type Definitions
const GroupErrors = {
  // Validation Errors (400)
  INVALID_GROUP_TYPE: {
    code: 400,
    message: "Invalid group type. Must be 'private' or 'open'",
  },
  INVALID_MAX_MEMBERS: {
    code: 400,
    message: "Maximum members must be at least 2",
  },
  EMPTY_GROUP_NAME: {
    code: 400,
    message: "Group name is required",
  },
  INVALID_MESSAGE: {
    code: 400,
    message: "Message content is required and must be between 1-5000 characters",
  },

  // Authorization Errors (403)
  NOT_GROUP_OWNER: {
    code: 403,
    message: "Only the group owner can perform this action",
  },
  NOT_GROUP_MEMBER: {
    code: 403,
    message: "You must be a group member to perform this action",
  },
  USER_BANNED: {
    code: 403,
    message: "You are banned from this group",
  },
  COOLDOWN_ACTIVE: {
    code: 403,
    message: "You must wait 48 hours before rejoining this private group",
  },
  PRIVATE_GROUP_ACCESS: {
    code: 403,
    message: "You must be a member to access this private group",
  },

  // Not Found Errors (404)
  GROUP_NOT_FOUND: {
    code: 404,
    message: "Group not found",
  },
  JOIN_REQUEST_NOT_FOUND: {
    code: 404,
    message: "Join request not found",
  },
  USER_NOT_FOUND: {
    code: 404,
    message: "User not found",
  },

  // Conflict Errors (409)
  ALREADY_MEMBER: {
    code: 409,
    message: "You are already a member of this group",
  },
  NOT_A_MEMBER: {
    code: 409,
    message: "You are not a member of this group",
  },
  PENDING_REQUEST_EXISTS: {
    code: 409,
    message: "You already have a pending join request for this group",
  },
  GROUP_FULL: {
    code: 409,
    message: "Group has reached maximum member capacity",
  },
  CANNOT_LEAVE_AS_OWNER: {
    code: 409,
    message: "Owner must transfer ownership before leaving the group",
  },
  CANNOT_DELETE_WITH_MEMBERS: {
    code: 409,
    message: "Group can only be deleted when you are the sole member",
  },
  CANNOT_BANISH_SELF: {
    code: 409,
    message: "Owner cannot banish themselves",
  },
  TARGET_NOT_MEMBER: {
    code: 409,
    message: "Target user is not a member of this group",
  },
  NEW_OWNER_NOT_MEMBER: {
    code: 409,
    message: "New owner must be a member of the group",
  },
  REQUEST_ALREADY_PROCESSED: {
    code: 409,
    message: "This join request has already been processed",
  },

  // Server Errors (500)
  DATABASE_ERROR: {
    code: 500,
    message: "Database operation failed",
  },
  UNKNOWN_ERROR: {
    code: 500,
    message: "An unexpected error occurred",
  },
};

module.exports = { GroupError, GroupErrors };
