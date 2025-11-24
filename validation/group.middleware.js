const { body, param } = require("express-validator");

// Validation for group creation
exports.group_validator = [
  body("name")
    .notEmpty()
    .withMessage("Group name is required")
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage("Group name must be between 3 and 50 characters"),

  body("type")
    .notEmpty()
    .withMessage("Group type is required")
    .isIn(["private", "open"])
    .withMessage("Group type must be 'private' or 'open'"),

  body("maxMembers")
    .optional()
    .isInt({ min: 2 })
    .withMessage("Maximum members must be at least 2"),
];

// Validation for group messages
exports.message_validator = [
  body("message")
    .notEmpty()
    .withMessage("Message is required")
    .trim()
    .isLength({ min: 1, max: 5000 })
    .withMessage("Message must be between 1 and 5000 characters"),
];

// Validation for group ID parameter
exports.groupId_validator = [
  param("groupId")
    .notEmpty()
    .withMessage("Group ID is required")
    .isMongoId()
    .withMessage("Invalid group ID format"),
];

// Validation for member operations
exports.member_validator = [
  body("userId")
    .notEmpty()
    .withMessage("User ID is required")
    .isMongoId()
    .withMessage("Invalid user ID format"),
];

// Validation for ownership transfer
exports.transfer_validator = [
  body("newOwnerId")
    .notEmpty()
    .withMessage("New owner ID is required")
    .isMongoId()
    .withMessage("Invalid new owner ID format"),
];

// Validation for join request operations
exports.requestId_validator = [
  body("requestId")
    .notEmpty()
    .withMessage("Request ID is required")
    .isMongoId()
    .withMessage("Invalid request ID format"),
];
