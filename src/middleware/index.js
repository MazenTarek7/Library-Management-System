const ValidationMiddleware = require("./validationMiddleware");
const {
  ErrorHandlerMiddleware,
  AppError,
  ValidationError,
  NotFoundError,
  ConflictError,
  DatabaseError,
  logger,
} = require("./errorHandlerMiddleware");
const {
  RequestLoggerMiddleware,
  requestLogger,
} = require("./requestLoggerMiddleware");
const { bookRateLimiter } = require("./rateLimitMiddleware");
const { basicAuth } = require("./authMiddleware");

module.exports = {
  ValidationMiddleware,
  ErrorHandlerMiddleware,
  RequestLoggerMiddleware,
  // Security middleware
  bookRateLimiter,
  basicAuth,
  // Error classes
  AppError,
  ValidationError,
  NotFoundError,
  ConflictError,
  DatabaseError,
  // Loggers
  logger,
  requestLogger,
};
