const ChatMessage = require("../models/chatMessage.model");
const Group = require("../models/group.model");
const { encryptMessage, decryptMessage } = require("./encryption.service");
const { logServiceExecution } = require("../utils/loggerWrapper");
const logger = require("../utils/logger");

// Send a group message
const sendGroupMessageService = logServiceExecution(
  "GroupMessageService",
  "sendGroupMessageService",
  async (userId, groupId, message) => {
    // Verify user is a member
    const group = await Group.findById(groupId);
    
    if (!group) {
      throw new Error("Group not found");
    }
    
    if (!group.isMember(userId)) {
      throw new Error("You must be a member to send messages");
    }
    
    // Encrypt the message before storing
    const encryptedMessage = encryptMessage(message);
    
    // Create message with encrypted content
    const groupMessage = await ChatMessage.create({
      message: encryptedMessage,
      fromUser: userId,
      group: groupId,
      messageType: "group",
    });
    
    // Populate sender information
    await groupMessage.populate("fromUser", "username email profileImage");
    
    // Decrypt message for response
    const messageObj = groupMessage.toObject();
    messageObj.message = decryptMessage(messageObj.message);
    
    return messageObj;
  },
  {
    sensitiveFields: ["message"],
    logResult: true,
    resultFormatter: (result) => `Message sent: ${result._id}`,
  }
);

// Get group message history with pagination
const getGroupMessageHistoryService = logServiceExecution(
  "GroupMessageService",
  "getGroupMessageHistoryService",
  async (groupId, options = {}) => {
    const { limit = 50, skip = 0 } = options;
    
    const messages = await ChatMessage.find({
      group: groupId,
      messageType: "group",
    })
      .populate("fromUser", "username email profileImage")
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit)
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

// Delete all messages for a group (when group is deleted)
const deleteGroupMessagesService = logServiceExecution(
  "GroupMessageService",
  "deleteGroupMessagesService",
  async (groupId) => {
    return await ChatMessage.deleteMany({
      group: groupId,
      messageType: "group",
    });
  },
  {
    logResult: true,
    resultFormatter: (result) => `Deleted count: ${result.deletedCount}`,
  }
);

module.exports = {
  sendGroupMessageService,
  getGroupMessageHistoryService,
  deleteGroupMessagesService,
};
