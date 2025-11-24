// Default sensitive fields that should be excluded from logs
const DEFAULT_SENSITIVE_FIELDS = [
  "password",
  "token",
  "accessToken",
  "refreshToken",
  "apiKey",
  "secret",
  "encryptionKey",
  "creditCard",
  "ssn",
  "cvv",
  "pin",
  "message", // Message content for privacy
  "encryptedMessage",
  "plaintext",
  "encrypted",
];

/**
 * Filters sensitive data from an object
 * @param {*} data - Data to filter (can be object, array, or primitive)
 * @param {Array<string>} customSensitiveFields - Additional fields to filter
 * @returns {*} - Sanitized copy of the data
 */
const filterSensitiveData = (data, customSensitiveFields = []) => {
  // Combine default and custom sensitive fields
  const sensitiveFields = [
    ...DEFAULT_SENSITIVE_FIELDS,
    ...customSensitiveFields,
  ];

  // Handle null or undefined
  if (data === null || data === undefined) {
    return data;
  }

  // Handle primitives (string, number, boolean)
  if (typeof data !== "object") {
    return data;
  }

  // Handle arrays
  if (Array.isArray(data)) {
    return data.map((item) =>
      filterSensitiveData(item, customSensitiveFields)
    );
  }

  // Handle objects
  const filtered = {};

  for (const key in data) {
    if (data.hasOwnProperty(key)) {
      // Check if field is sensitive
      const isSensitive = sensitiveFields.some(
        (field) => key.toLowerCase().includes(field.toLowerCase())
      );

      if (isSensitive) {
        filtered[key] = "[FILTERED]";
      } else if (typeof data[key] === "object" && data[key] !== null) {
        // Recursively filter nested objects and arrays
        filtered[key] = filterSensitiveData(data[key], customSensitiveFields);
      } else {
        filtered[key] = data[key];
      }
    }
  }

  return filtered;
};

/**
 * Creates a summary of data for logging (e.g., count, type)
 * @param {*} data - Data to summarize
 * @returns {string} - Summary string
 */
const createDataSummary = (data) => {
  if (data === null || data === undefined) {
    return "null";
  }

  if (Array.isArray(data)) {
    return `Array(${data.length})`;
  }

  if (typeof data === "object") {
    const keys = Object.keys(data);
    return `Object{${keys.slice(0, 3).join(", ")}${keys.length > 3 ? "..." : ""}}`;
  }

  return typeof data;
};

module.exports = {
  filterSensitiveData,
  createDataSummary,
  DEFAULT_SENSITIVE_FIELDS,
};
