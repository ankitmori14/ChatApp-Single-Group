const logger = require("./logger");
const {
  filterSensitiveData,
  createDataSummary,
} = require("./sensitiveDataFilter");

/**
 * Wraps a service function with automatic logging
 * @param {string} serviceName - Name of the service (e.g., 'UserService')
 * @param {string} functionName - Name of the function (e.g., 'createUserService')
 * @param {Function} serviceFunction - The actual service function to execute
 * @param {Object} options - Configuration options
 * @param {Array<string>} options.sensitiveFields - Additional fields to exclude from logs
 * @param {boolean} options.logParams - Whether to log input parameters (default: true)
 * @param {boolean} options.logResult - Whether to log result summary (default: false)
 * @param {Function} options.resultFormatter - Custom function to format result for logging
 * @returns {Function} - Wrapped function with logging
 */
const logServiceExecution = (
  serviceName,
  functionName,
  serviceFunction,
  options = {}
) => {
  const {
    sensitiveFields = [],
    logParams = true,
    logResult = false,
    resultFormatter = null,
  } = options;

  return async function (...args) {
    const startTime = Date.now();

    // Log function entry
    let entryMessage = `Service: ${serviceName} | Function: ${functionName} | Action: START`;

    if (logParams && args.length > 0) {
      const sanitizedParams = args.map((arg) =>
        filterSensitiveData(arg, sensitiveFields)
      );
      entryMessage += ` | Params: ${JSON.stringify(sanitizedParams)}`;
    }

    logger.info(entryMessage);

    try {
      // Execute the service function
      const result = await serviceFunction(...args);

      // Calculate execution duration
      const duration = Date.now() - startTime;

      // Log function exit
      let exitMessage = `Service: ${serviceName} | Function: ${functionName} | Action: END | Duration: ${duration}ms`;

      if (logResult && result !== undefined) {
        if (resultFormatter && typeof resultFormatter === "function") {
          const formattedResult = resultFormatter(result);
          exitMessage += ` | Result: ${formattedResult}`;
        } else {
          const resultSummary = createDataSummary(result);
          exitMessage += ` | Result: ${resultSummary}`;
        }
      }

      logger.info(exitMessage);

      return result;
    } catch (error) {
      // Calculate execution duration
      const duration = Date.now() - startTime;

      // Log error with context
      let errorMessage = `Service: ${serviceName} | Function: ${functionName} | Action: ERROR | Duration: ${duration}ms | Message: ${error.message}`;

      if (logParams && args.length > 0) {
        const sanitizedParams = args.map((arg) =>
          filterSensitiveData(arg, sensitiveFields)
        );
        errorMessage += ` | Params: ${JSON.stringify(sanitizedParams)}`;
      }

      logger.error(errorMessage, { stack: error.stack });

      // Re-throw the error to maintain existing error handling
      throw error;
    }
  };
};

module.exports = {
  logServiceExecution,
};
