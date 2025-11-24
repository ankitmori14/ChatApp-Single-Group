const { validationResult } = require("express-validator");
const sendResponse = require("./response.service");
const logger = require("../utils/logger");

const validatorFunc = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorDetails = errors.array().map(err => `${err.param}: ${err.msg}`).join(", ");
    logger.warn(`Validation failed: ${errorDetails}`);
    return sendResponse(res, 400, false, errors.array()[0].msg, null);
  }
  logger.debug("Validation passed");
  next();
};

module.exports = {
  validatorFunc,
};
