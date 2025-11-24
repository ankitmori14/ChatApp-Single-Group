const ChatMessage = require("../models/chatMessage.model");
const User = require("../models/user.model");
const { decryptMessage } = require("./encryption.service");
const { logServiceExecution } = require("../utils/loggerWrapper");
const logger = require("../utils/logger");

const createUserService = logServiceExecution(
  "UserService",
  "createUserService",
  async (payload) => {
    return await User.create(payload);
  },
  { sensitiveFields: ["password"] }
);

const userFindOneService = logServiceExecution(
  "UserService",
  "userFindOneService",
  async (filter) => {
    return await User.findOne(filter);
  },
  { sensitiveFields: ["password"] }
);

const userUpdateService = logServiceExecution(
  "UserService",
  "userUpdateService",
  async (userId, payload) => {
    return await User.findByIdAndUpdate(userId, payload, { new: true });
  },
  { sensitiveFields: ["password"] }
);

const getAllUsersService = logServiceExecution(
  "UserService",
  "getAllUsersService",
  async (req) => {
    const users = await User.find({ _id: { $ne: req.user._id } }).select([
      "_id",
      "email",
      "username",
      "profileImage",
      "isOnline"
    ]);
    return users;
  },
  {
    sensitiveFields: ["password"],
    logResult: true,
    resultFormatter: (result) => `User count: ${result.length}`,
  }
);

const getUserChatHistoryService = logServiceExecution(
  "UserService",
  "getUserChatHistoryService",
  async (payload) => {
    const { fromUser, toUser } = payload;
    let messages = await ChatMessage.find({
      $or: [
        {
          $and: [{ fromUser: fromUser }, { toUser: toUser }],
        },
        {
          $and: [{ fromUser: toUser }, { toUser: fromUser }],
        },
      ],
    })
      .sort({ createdAt: 1 })
      .lean();

    // Decrypt all messages before returning
    const decryptedMessages = messages.map((msg) => {
      try {
        return {
          ...msg,
          message: decryptMessage(msg.message),
        };
      } catch (error) {
        logger.error(`Failed to decrypt message: ${msg._id} | Error: ${error.message}`);
        return {
          ...msg,
          message: "[Encrypted message - decryption failed]",
        };
      }
    });

    return decryptedMessages;
  },
  {
    logResult: true,
    resultFormatter: (result) => `Message count: ${result.length}`,
  }
);

module.exports = {
  createUserService,
  userFindOneService,
  userUpdateService,
  getAllUsersService,
  getUserChatHistoryService,
};
