const logger = require("../utils/logger");

const sendResponse = (res, statusCode, status, message, data) => {
  try {
    const response = {
      status: status,
      message: message,
    };

    if (statusCode == 500) {
      response.error = data.message;
    } else {
      response.data = data;
    }

    // Log based on status code
    if (statusCode >= 500) {
      logger.error(`Response: ${statusCode} | Status: ${status} | Message: ${message}`);
    } else if (statusCode >= 400) {
      logger.warn(`Response: ${statusCode} | Status: ${status} | Message: ${message}`);
    } else {
      logger.info(`Response: ${statusCode} | Status: ${status} | Message: ${message}`);
    }

    res.writeHead(statusCode, { "Content-Type": "application/json" });
    res.write(JSON.stringify(response));
    res.end();
  } catch (error) {
    logger.error(`Response service error: ${error.message}`, { stack: error.stack });
    throw error;
  }
};

module.exports = sendResponse;
