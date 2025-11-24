const {
  getLogsService,
  getErrorLogsService,
  getServiceLogsService,
  getSlowOperationsService,
  getLogStatsService,
} = require("../services/log.service");
const sendResponse = require("../services/response.service");

/**
 * Get logs with filters
 */
const getLogs = async (req, res) => {
  try {
    const filters = {
      level: req.query.level,
      service: req.query.service,
      function: req.query.function,
      action: req.query.action,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      minDuration: req.query.minDuration,
      search: req.query.search,
    };

    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 50,
      sortBy: req.query.sortBy || "timestamp",
      sortOrder: req.query.sortOrder || "desc",
    };

    const result = await getLogsService(filters, options);
    return sendResponse(res, 200, true, "Logs retrieved successfully", result);
  } catch (error) {
    return sendResponse(res, 500, false, "Failed to retrieve logs", error);
  }
};

/**
 * Get error logs
 */
const getErrorLogs = async (req, res) => {
  try {
    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 50,
    };

    const result = await getErrorLogsService(options);
    return sendResponse(
      res,
      200,
      true,
      "Error logs retrieved successfully",
      result
    );
  } catch (error) {
    return sendResponse(res, 500, false, "Failed to retrieve error logs", error);
  }
};

/**
 * Get logs by service
 */
const getServiceLogs = async (req, res) => {
  try {
    const { serviceName } = req.params;
    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 50,
    };

    const result = await getServiceLogsService(serviceName, options);
    return sendResponse(
      res,
      200,
      true,
      `Logs for ${serviceName} retrieved successfully`,
      result
    );
  } catch (error) {
    return sendResponse(
      res,
      500,
      false,
      "Failed to retrieve service logs",
      error
    );
  }
};

/**
 * Get slow operations
 */
const getSlowOperations = async (req, res) => {
  try {
    const threshold = parseInt(req.query.threshold) || 1000;
    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 50,
    };

    const result = await getSlowOperationsService(threshold, options);
    return sendResponse(
      res,
      200,
      true,
      "Slow operations retrieved successfully",
      result
    );
  } catch (error) {
    return sendResponse(
      res,
      500,
      false,
      "Failed to retrieve slow operations",
      error
    );
  }
};

/**
 * Get log statistics
 */
const getLogStats = async (req, res) => {
  try {
    const filters = {
      startDate: req.query.startDate,
      endDate: req.query.endDate,
    };

    const result = await getLogStatsService(filters);
    return sendResponse(
      res,
      200,
      true,
      "Log statistics retrieved successfully",
      result
    );
  } catch (error) {
    return sendResponse(
      res,
      500,
      false,
      "Failed to retrieve log statistics",
      error
    );
  }
};

module.exports = {
  getLogs,
  getErrorLogs,
  getServiceLogs,
  getSlowOperations,
  getLogStats,
};
