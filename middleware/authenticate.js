const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const sendResponse = require("../services/response.service");
const User = require("../models/user.model");
const { API_SECRET } = require("../environment/environment");
const ObjectId = mongoose.Types.ObjectId;

let authenticate = async (req, res, next) => {
  try {
    if (!req.header("Authorization")) {
      return sendResponse(res, 401, false, "Unauthorized, please login.", null);
    }

    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return sendResponse(res, 404, false, "Token not found", null);
    }

    const decoded = jwt.verify(token, API_SECRET);

    const user = await User.aggregate([
      {
        $match: {
          _id: new ObjectId(decoded._id),
        },
      },
    ]);

    if (user.length == 0) {
      return sendResponse(res, 404, false, "User not found", null);
    }

    req.user = user[0];
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return sendResponse(res, 401, false, "Token expired", {
        message: error.message,
      });
    }
    return sendResponse(res, 500, false, "Something went worng!", {
      message: error.message,
    });
  }
};

module.exports = authenticate;
