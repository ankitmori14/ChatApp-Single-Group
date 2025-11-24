const express = require("express");
const {
  getLogs,
  getErrorLogs,
  getServiceLogs,
  getSlowOperations,
  getLogStats,
} = require("../controller/log.controller");
const authenticate = require("../middleware/authenticate");

const router = express.Router();

// All log routes require authentication
router.use(authenticate);

/**
 * @route   GET /logs
 * @desc    Get logs with filters and pagination
 * @query   level, service, function, action, startDate, endDate, minDuration, search, page, limit, sortBy, sortOrder
 * @access  Private
 */
router.get("/", getLogs);

/**
 * @route   GET /logs/errors
 * @desc    Get error logs
 * @query   page, limit
 * @access  Private
 */
router.get("/errors", getErrorLogs);

/**
 * @route   GET /logs/service/:serviceName
 * @desc    Get logs for a specific service
 * @param   serviceName - Name of the service
 * @query   page, limit
 * @access  Private
 */
router.get("/service/:serviceName", getServiceLogs);

/**
 * @route   GET /logs/slow
 * @desc    Get slow operations
 * @query   threshold (default: 1000ms), page, limit
 * @access  Private
 */
router.get("/slow", getSlowOperations);

/**
 * @route   GET /logs/stats
 * @desc    Get log statistics
 * @query   startDate, endDate
 * @access  Private
 */
router.get("/stats", getLogStats);

module.exports = router;
