const mongoose = require("mongoose");
const { DB_URL } = require("../environment/environment");

MONGODB_URI = DB_URL;

mongoose.connect(MONGODB_URI);

mongoose.connection.on("connected", async () => {
  console.log("Database connected!");
  
  // Create indexes for group management models
  try {
    const Group = require("../models/group.model");
    const GroupJoinRequest = require("../models/groupJoinRequest.model");
    const GroupMemberHistory = require("../models/groupMemberHistory.model");
    const ChatMessage = require("../models/chatMessage.model");
    
    await Group.createIndexes();
    await GroupJoinRequest.createIndexes();
    await GroupMemberHistory.createIndexes();
    await ChatMessage.createIndexes();
    
    console.log("Database indexes created successfully!");
  } catch (error) {
    console.log("Error creating indexes:", error.message);
  }
});

mongoose.connection.on("error", (err) => {
  console.log("Mongodb Connection failed! ", err);
  mongoose.disconnect();
});

module.exports = mongoose;
