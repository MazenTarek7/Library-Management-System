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

module.exports = {
  ValidationMiddleware,
  ErrorHandlerMiddleware,
  RequestLoggerMiddleware,
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
