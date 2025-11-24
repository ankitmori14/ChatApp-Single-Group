const winston = require("winston");
require("winston-daily-rotate-file");
require("winston-mongodb");

// Determine log level from environment or default to 'info'
const logLevel = process.env.LOG_LEVEL || "info";
const isProduction = process.env.NODE_ENV === "production";
const dbUrl = process.env.DB_URL;

// Custom log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.errors({ stack: true }),
  winston.format.printf((info) => {
    const { timestamp, level, message, stack } = info;
    if (stack) {
      return `${timestamp} [${level.toUpperCase()}]: ${message}\n${stack}`;
    }
    return `${timestamp} [${level.toUpperCase()}]: ${message}`;
  })
);

// Console transport for development
const consoleTransport = new winston.transports.Console({
  format: winston.format.combine(
    winston.format.colorize(),
    logFormat
  ),
});

// File transport for errors (with rotation)
const errorFileTransport = new winston.transports.DailyRotateFile({
  filename: "logs/error-%DATE%.log",
  datePattern: "YYYY-MM-DD",
  level: "error",
  maxSize: "20m",
  maxFiles: "14d",
  format: logFormat,
});

// File transport for all logs (with rotation)
const combinedFileTransport = new winston.transports.DailyRotateFile({
  filename: "logs/combined-%DATE%.log",
  datePattern: "YYYY-MM-DD",
  maxSize: "20m",
  maxFiles: "14d",
  format: logFormat,
});

// MongoDB transport for storing logs in database
const mongoTransport = new winston.transports.MongoDB({
  db: dbUrl,
  collection: "logs",
  level: logLevel,
  options: {
    useUnifiedTopology: true,
  },
  metaKey: "meta",
  expireAfterSeconds: 2592000, // 30 days TTL
  capped: false,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
});

// Configure transports based on environment
const transports = [];

if (isProduction) {
  // Production: MongoDB + file transports
  transports.push(mongoTransport, errorFileTransport, combinedFileTransport);
} else {
  // Development: console + MongoDB + file transports
  transports.push(consoleTransport, mongoTransport, errorFileTransport, combinedFileTransport);
}

// Create the logger instance
const logger = winston.createLogger({
  level: logLevel,
  transports,
  exitOnError: false,
});

// Handle MongoDB transport errors gracefully
mongoTransport.on("error", (error) => {
  console.error("MongoDB logging error:", error.message);
});

// Log initialization
logger.info(`Logger initialized with level: ${logLevel} | Environment: ${process.env.NODE_ENV || "development"} | MongoDB logging: enabled`);

module.exports = logger;
