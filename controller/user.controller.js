const bcrypt = require("bcryptjs");
const sendResponse = require("../services/response.service");
const {
  createUserService,
  userFindOneService,
  userUpdateService,
  getAllUsersService,
  getUserChatHistoryService,
} = require("../services/user.service");
const { sendPushNotification } = require("../services/push-notification.service");
const https = require("https");

const createUser = async (req, res) => {
  try {
    const reqBody = req.body;

    let userIsExist = await userFindOneService({ email: reqBody.email });

    if (userIsExist) {
      return sendResponse(res, 400, false, "Duplicate email found", null);
    }

    // Hash password
    reqBody.password = await bcrypt.hash(reqBody.password, 10);

    const user = await createUserService(reqBody);
    return sendResponse(res, 200, true, "User registerd", user);
  } catch (error) {
    return sendResponse(res, 500, false, "Something went worng!", {
      message: error.message,
    });
  }
};

const userLogin = async (req, res) => {
  try {
    const reqBody = req.body;
    let user = await userFindOneService({ email: reqBody.email });

    if (!user) {
      return sendResponse(res, 404, false, "User does not exist", null);
    }

    if (!bcrypt.compareSync(reqBody.password, user.password)) {
      return sendResponse(res, 400, false, "Password is invalid", null);
    }

    const token = await user.generateAuthToken();
    let userData = await userUpdateService(user._id, {
      isOnline: true,
    });

    userData = userData.toObject();
    delete userData.password;

    return sendResponse(res, 200, true, "Login successfully", {
      userData,
      token,
    });
  } catch (error) {
    return sendResponse(res, 500, false, "Something went worng!", {
      message: error.message,
    });
  }
};

const setAvatar = async (req, res) => {
  try {
    const userId = req.user._id;
    const avatarImage = req.body.image;
    const userData = await userUpdateService(userId, {
      isAvatarImageSet: true,
      profileImage: avatarImage,
    });

    return sendResponse(res, 200, true, "Profile avatar updated", userData);
  } catch (error) {
    return sendResponse(res, 500, false, "Something went worng!", {
      message: error.message,
    });
  }
};

const allusers = async (req, res) => {
  try {
    const users = await getAllUsersService(req);

    return sendResponse(res, 200, true, "User List", users);
  } catch (error) {
    return sendResponse(res, 500, false, "Something went worng!", {
      message: error.message,
    });
  }
};

const chatHistory = async (req, res) => {
  try {
    const payload = {
      fromUser: req.user._id,
      toUser: req.params.toUser,
    };
    const message = await getUserChatHistoryService(payload);
    return sendResponse(res, 200, true, "", message);
  } catch (error) {
    return sendResponse(res, 500, false, "Something went worng!", {
      message: error.message,
    });
  }
};

const logoutUser = async (req, res) => {
  try {
    const user = req.user;

    // set user to offline
    await userUpdateService(user._id, {
      isOnline: false,
    });

    return sendResponse(res, 200, true, "Logout successfully", null);
  } catch (error) {
    return sendResponse(res, 500, false, "Something went worng!", {
      message: error.message,
    });
  }
};

const pushNotification = async (req, res) => {
  try {
    const user = req.user;
    await userUpdateService(user._id, {
      push_notification_endpoint: req.body,
    });

    return sendResponse(res, 200, true, "", null);
  } catch (error) {
    return sendResponse(res, 500, false, "Something went worng!", {
      message: error.message,
    });
  }
};

const sendMessageToUser = async (req, res) => {
  try {
    const { fromUser, toUser, message } = req.body;
    await sendPushNotification(fromUser, toUser, message);
    return sendResponse(res, 200, true, "", null);
  } catch (error) {
    return sendResponse(res, 500, false, "Something went worng!", {
      message: error.message,
    });
  }
}

const getAvatar = async (req, res) => {
  try {
    // Use DiceBear API - a free avatar generation service
    const randomSeed = Math.random().toString(36).substring(7);
    const styles = ['avataaars', 'bottts', 'fun-emoji', 'pixel-art', 'lorelei'];
    const randomStyle = styles[Math.floor(Math.random() * styles.length)];
    const avatarUrl = `https://api.dicebear.com/7.x/${randomStyle}/svg?seed=${randomSeed}`;

    https.get(avatarUrl, (apiResponse) => {
      let data = '';

      apiResponse.on('data', (chunk) => {
        data += chunk;
      });

      apiResponse.on('end', () => {
        return sendResponse(res, 200, true, "Avatar fetched", { svg: data });
      });
    }).on('error', (error) => {
      return sendResponse(res, 500, false, "Failed to fetch avatar", {
        message: error.message,
      });
    });
  } catch (error) {
    return sendResponse(res, 500, false, "Something went wrong!", {
      message: error.message,
    });
  }
}

module.exports = {
  createUser,
  userLogin,
  setAvatar,
  allusers,
  chatHistory,
  logoutUser,
  pushNotification,
  sendMessageToUser,
  getAvatar
};
