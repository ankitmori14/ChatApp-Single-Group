const express = require("express");
const {
  createUser,
  userLogin,
  setAvatar,
  allusers,
  chatHistory,
  logoutUser,
  pushNotification,
  sendMessageToUser,
  getAvatar
} = require("../controller/user.controller");
const { user_validator } = require("../validation/user.middleware");
const { validatorFunc } = require("../services/bodyvalidator.service");
const authenticate = require("../middleware/authenticate");
const userRouter = express.Router();

userRouter.post("/login", userLogin);
userRouter.post("/register", user_validator, validatorFunc, createUser);
userRouter.post("/setavatar", authenticate, setAvatar);
userRouter.get("/allusers", authenticate, allusers);
userRouter.get("/chatHistory/:toUser", authenticate, chatHistory);
userRouter.post('/pushNotification', authenticate, pushNotification);
userRouter.post('/sendMessageToUser', authenticate, sendMessageToUser);
userRouter.post("/logout", authenticate, logoutUser);
userRouter.get("/getavatar", getAvatar);

module.exports = userRouter;
