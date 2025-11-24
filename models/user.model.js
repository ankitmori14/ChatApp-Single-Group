const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const { API_SECRET } = require("../environment/environment");

let userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    profileImage: {
      type: String,
      default: "",
    },
    isAvatarImageSet: {
      type: Boolean,
      default: false,
    },
    is_google_login: {
      type: Boolean,
      default: false,
    },
    is_facebook_login: {
      type: Boolean,
      default: false,
    },
    isOnline: {
      type: Boolean,
      default: false
    },
    push_notification_endpoint: {
      type: Object,
    }
  },
  {
    timestamps: true, // Enable the timestamps option
  }
);

userSchema.methods.generateAuthToken = async function () {
  let user = this;
  let token = jwt.sign(
    {
      _id: user._id.toString(),
      role: user.role,
    },
    API_SECRET,
    {
      expiresIn: "30d",
    }
  );

  user.auth_token = token;
  await user.save();
  return token;
};

const User = mongoose.model("user", userSchema, "user");
module.exports = User;
