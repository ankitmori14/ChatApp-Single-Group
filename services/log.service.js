const Log = require("../models/log.model");

/**
 * Get logs with filtering and pagination
 * @param {Object} filters - Filter criteria
 * @param {Object} options - Pagination and sorting options
 * @returns {Promise<Object>} - Logs and metadata
 */
const getLogsService = async (filters = {}, options = {}) => {
  const {
    page = 1,
    limit = 50,
    sortBy = "timestamp",
    sortOrder = "desc",
  } = options;

  const query = {};

  // Apply filters
  if (filters.level) {
    query.level = filters.level;
  }

  if (filters.service) {
    query.service = filters.service;
  }

  if (filters.function) {
    query.function = filters.function;
  }

  if (filters.action) {
    query.action = filters.action;
  }

  if (filters.startDate || filters.endDate) {
    query.timestamp = {};
    if (filters.startDate) {
      query.timestamp.$gte = new Date(filters.startDate);
    }
    if (filters.endDate) {
      query.timestamp.$lte = new Date(filters.endDate);
    }
  }

  if (filters.minDuration) {
    query.duration = { $gte: parseInt(filters.minDuration) };
  }

  if (filters.search) {
    query.message = { $regex: filters.search, $options: "i" };
  }

  const skip = (page - 1) * limit;
  const sort = { [sortBy]: sortOrder === "desc" ? -1 : 1 };

  const [logs, total] = await Promise.all([
    Log.find(query).sort(sort).skip(skip).limit(limit).lean(),
    Log.countDocuments(query),
  ]);

  return {
    logs,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get error logs
 * @param {Object} options - Pagination options
 * @returns {Promise<Object>} - Error logs
 */
const getErrorLogsService = async (options = {}) => {
  return await getLogsService({ level: "error" }, options);
};

/**
 * Get logs by service
 * @param {string} serviceName - Service name
 * @param {Object} options - Pagination options
 * @returns {Promise<Object>} - Service logs
 */
const getServiceLogsService = async (serviceName, options = {}) => {
  return await getLogsService({ service: serviceName }, options);
};

/**
 * Get slow operations (duration > threshold)
 * @param {number} threshold - Duration threshold in milliseconds
 * @param {Object} options - Pagination options
 * @returns {Promise<Object>} - Slow operation logs
 */
const getSlowOperationsService = async (threshold = 1000, options = {}) => {
  return await getLogsService({ minDuration: threshold }, options);
};

/**
 * Get log statistics
 * @param {Object} filters - Filter criteria
 * @returns {Promise<Object>} - Statistics
 */
const getLogStatsService = async (filters = {}) => {
  const query = {};

  if (filters.startDate || filters.endDate) {
    query.timestamp = {};
    if (filters.startDate) {
      query.timestamp.$gte = new Date(filters.startDate);
    }
    if (filters.endDate) {
      query.timestamp.$lte = new Date(filters.endDate);
    }
  }

  const [levelStats, serviceStats, avgDuration] = await Promise.all([
    // Count by level
    Log.aggregate([
      { $match: query },
      { $group: { _id: "$level", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),

    // Count by service
    Log.aggregate([
      { $match: query },
      { $group: { _id: "$service", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]),

    // Average duration by service and function
    Log.aggregate([
      {
        $match: {
          ...query,
          action: "END",
          duration: { $exists: true },
        },
      },
      {
        $group: {
          _id: { service: "$service", function: "$function" },
          avgDuration: { $avg: "$duration" },
          minDuration: { $min: "$duration" },
          maxDuration: { $max: "$duration" },
          count: { $sum: 1 },
        },
      },
      { $sort: { avgDuration: -1 } },
      { $limit: 10 },
    ]),
  ]);

  return {
    byLevel: levelStats,
    byService: serviceStats,
    slowestOperations: avgDuration,
  };
};

/**
 * Delete old logs (older than specified days)
 * @param {number} days - Number of days to keep
 * @returns {Promise<Object>} - Deletion result
 */
const deleteOldLogsService = async (days = 30) => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const result = await Log.deleteMany({
    timestamp: { $lt: cutoffDate },
  });

  return {
    deletedCount: result.deletedCount,
    cutoffDate,
  };
};

module.exports = {
  getLogsService,
  getErrorLogsService,
  getServiceLogsService,
  getSlowOperationsService,
  getLogStatsService,
  deleteOldLogsService,
};
