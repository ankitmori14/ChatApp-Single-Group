const ChatMessage = require("../models/chatMessage.model");
const Group = require("../models/group.model");
const { sendGroupMessageService } = require("./groupMessage.service");
const { encryptMessage, decryptMessage } = require("./encryption.service");
const logger = require("../utils/logger");

// Helper function to verify group membership
const verifyGroupMembership = async (groupId, userId) => {
  try {
    const group = await Group.findById(groupId);
    return group && group.isMember(userId);
  } catch (error) {
    return false;
  }
};

let io;
const socketSetup = (server) => {
  io = require("socket.io")(server, {
    cors: {
      origin: [
        "http://localhost",
        "http://localhost:4200",
        "http://localhost:4201",
        "http://127.0.0.1:4200"
      ],
      methods: ["GET", "PATCH", "POST", "HEAD", "OPTIONS"],
      transports: ["websocket"],
    },
  });

  let userCount = 0;

  io.on("connection", (socket) => {
    userCount++;
    logger.info(`Socket: User connected | Total users: ${userCount}`);

    // diconnected event
    socket.on("disconnect", () => {
      userCount--;
      logger.info(`Socket: User disconnected | Total users: ${userCount}`);
    });

    socket.on("room", async (obj) => {
      var rooms = io.sockets.adapter.rooms;
      var room = rooms.get(obj.id);

      socket.join(obj.id);

      socket.on("sendMessage", async (messageObj) => {
        const { fromUser, toUser, message } = messageObj;
        try {
          // Encrypt message before storing
          const encryptedMessage = encryptMessage(message);
          
          const messaged = new ChatMessage({ 
            fromUser, 
            toUser, 
            message: encryptedMessage,
            messageType: "direct"
          });
          messaged.toUser = toUser;

          await messaged.save();
          
          // Decrypt message for real-time delivery
          const messageToSend = messaged.toObject();
          messageToSend.message = decryptMessage(messageToSend.message);
          
          socket.to(toUser).emit("receiveMessage", messageToSend);
        } catch (error) {
          logger.error(`Socket: Error sending message | Error: ${error.message}`, { stack: error.stack });
        }
      });

      socket.on("callInit", async (calledDetails) => {
        const { fromUser, toUser } = calledDetails;

        socket.to(toUser?._id).emit("anyOneCalling", {
          callerDetails: fromUser,
          receiverDetails: toUser,
        });
      });

      socket.on("callendFromCaller", async (calledDetails) => {
        const { fromUser, toUser, callend } = calledDetails;

        socket.to(toUser?._id).emit("callendFromCallerEmit", { callend });
      });

      socket.on("callendFromReceiver", async (calledDetails) => {
        const { fromUser, toUser, callend } = calledDetails;

        socket.to(toUser?._id).emit("callendFromReceiverEmit", { callend });
      });

      socket.on("receiverPickUpCall", async (calledDetails) => {
        const { fromUser, toUser } = calledDetails;

        socket
          .to(toUser?._id)
          .emit("receiverPickUpCallEmit", { callPickUp: true });
      });

      socket.on("ready", (roomName) => {
        logger.debug("Socket: WebRTC ready event");
        socket.to(roomName.reciverUser).emit("ready", roomName);
      });

      socket.on("candidate", (calledDetails) => {
        logger.debug("Socket: WebRTC candidate event");
        const { fromUser, toUser, candidate } = calledDetails;
        socket.to(toUser?._id).emit("candidate", candidate);
      });

      socket.on("offer", (calledDetails) => {
        logger.debug("Socket: WebRTC offer event");
        const { fromUser, toUser, offer } = calledDetails;
        socket.to(toUser?._id).emit("offer", offer);
      });

      socket.on("answer", (calledDetails) => {
        logger.debug("Socket: WebRTC answer event");
        const { fromUser, toUser, answer } = calledDetails;
        socket.to(toUser?._id).emit("answer", answer);
      });

      socket.on("userConnect", (userData) => {
        socket.broadcast.emit("userConnected", userData);
      });

      socket.on("userDisconnect", (userData) => {
        socket.broadcast.emit("userDisconnected", userData);
      });
    });

    // Group room management
    socket.on("joinGroupRoom", async (groupData) => {
      const { groupId, userId } = groupData;

      try {
        // Verify user is a member
        const isMember = await verifyGroupMembership(groupId, userId);

        if (isMember) {
          socket.join(`group_${groupId}`);
          socket.emit("groupRoomJoined", { groupId, success: true });
          logger.info(`Socket: User ${userId} joined group room: group_${groupId}`);
        } else {
          socket.emit("groupRoomError", {
            message: "You are not a member of this group",
          });
        }
      } catch (error) {
        socket.emit("groupRoomError", { message: error.message });
      }
    });

    socket.on("leaveGroupRoom", (groupData) => {
      const { groupId } = groupData;
      socket.leave(`group_${groupId}`);
      socket.emit("groupRoomLeft", { groupId });
      logger.info(`Socket: User left group room: group_${groupId}`);
    });

    // Group messaging
    socket.on("sendGroupMessage", async (messageData) => {
      const { groupId, userId, message } = messageData;

      try {
        // Verify membership
        const isMember = await verifyGroupMembership(groupId, userId);

        if (!isMember) {
          socket.emit("groupMessageError", {
            message: "You are not a member of this group",
          });
          return;
        }

        // Save message
        const savedMessage = await sendGroupMessageService(
          userId,
          groupId,
          message
        );

        // Broadcast to all group members (including sender)
        io.to(`group_${groupId}`).emit("receiveGroupMessage", savedMessage);
        logger.info(`Socket: Message sent to group: group_${groupId}`);
      } catch (error) {
        socket.emit("groupMessageError", { message: error.message });
      }
    });

    // Group member events
    socket.on("memberJoinedGroup", (eventData) => {
      const { groupId, member } = eventData;
      io.to(`group_${groupId}`).emit("groupMemberJoined", member);
      logger.info(`Socket: Member joined group: group_${groupId}`);
    });

    socket.on("memberLeftGroup", (eventData) => {
      const { groupId, memberId } = eventData;
      io.to(`group_${groupId}`).emit("groupMemberLeft", { memberId });
      logger.info(`Socket: Member left group: group_${groupId}`);
    });
  });
};

module.exports = socketSetup;
