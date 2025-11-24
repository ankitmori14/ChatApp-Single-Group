const express = require("express");
const userRouter = require("./user.route");
const groupRouter = require("./group.route");
const logRouter = require("./log.route");

// Root Router
const RootRouter = express.Router();

RootRouter.use("/user", userRouter);
RootRouter.use("/group", groupRouter);
RootRouter.use("/logs", logRouter);

module.exports = RootRouter;
