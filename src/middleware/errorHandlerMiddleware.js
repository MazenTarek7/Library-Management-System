const winston = require("winston");

/**
 * Configure Winston logger for error handling
 */
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: "library-management-system" },
  transports: [
    new winston.transports.File({
      filename: "logs/error.log",
      level: "error",
      maxsize: 5242880,
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: "logs/combined.log",
      maxsize: 5242880,
      maxFiles: 5,
    }),
  ],
});

if (process.env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    })
  );
}

/**
 * Custom error classes for different error types
 */
class AppError extends Error {
  constructor(message, statusCode, code = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, details = []) {
    super(message, 400, "VALIDATION_ERROR");
    this.details = details;
  }
}

class NotFoundError extends AppError {
  constructor(message = "Resource not found") {
    super(message, 404, "NOT_FOUND");
  }
}

class ConflictError extends AppError {
  constructor(message) {
    super(message, 409, "CONFLICT");
  }
}

class DatabaseError extends AppError {
  constructor(message = "Database operation failed") {
    super(message, 500, "DATABASE_ERROR");
  }
}

/**
 * Error handling middleware
 */
class ErrorHandlerMiddleware {
  /**
   * Main error handling middleware
   * @param {Error} err - Error object
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  static handle(err, req, res, next) {
    let error = { ...err };
    error.message = err.message;

    // Log error details
    const errorContext = {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.get("User-Agent"),
      timestamp: new Date().toISOString(),
      requestId: req.id || "unknown",
    };

    if (err.name === "ValidationError" || err.code === "VALIDATION_ERROR") {
      error = ErrorHandlerMiddleware._handleValidationError(err);
    } else if (err.name === "CastError" || err.code === "22P02") {
      error = ErrorHandlerMiddleware._handleCastError(err);
    } else if (err.code === "23505") {
      error = ErrorHandlerMiddleware._handleDuplicateError(err);
    } else if (err.code === "23503") {
      error = ErrorHandlerMiddleware._handleForeignKeyError(err);
    } else if (err.code === "23514") {
      error = ErrorHandlerMiddleware._handleCheckConstraintError(err);
    } else if (err.code && err.code.startsWith("23")) {
      error = ErrorHandlerMiddleware._handleDatabaseConstraintError(err);
    } else if (
      err.code &&
      (err.code.startsWith("08") || err.code.startsWith("53"))
    ) {
      error = ErrorHandlerMiddleware._handleDatabaseConnectionError(err);
    } else if (!err.isOperational) {
      error = ErrorHandlerMiddleware._handleUnknownError(err);
    }

    if (error.statusCode >= 500) {
      logger.error("Server Error", {
        error: {
          message: error.message,
          stack: err.stack,
          code: error.code,
        },
        request: errorContext,
      });
    } else if (error.statusCode >= 400) {
      logger.warn("Client Error", {
        error: {
          message: error.message,
          code: error.code,
        },
        request: errorContext,
      });
    }

    ErrorHandlerMiddleware._sendErrorResponse(res, error);
  }

  /**
   * Handle validation errors
   * @param {Error} err - Original error
   * @returns {Object} Formatted error
   */
  static _handleValidationError(err) {
    return {
      statusCode: 400,
      code: "VALIDATION_ERROR",
      message: "Invalid input data",
      details: err.details || [],
    };
  }

  /**
   * Handle cast errors (invalid data type)
   * @param {Error} err - Original error
   * @returns {Object} Formatted error
   */
  static _handleCastError(err) {
    return {
      statusCode: 400,
      code: "INVALID_DATA_TYPE",
      message: "Invalid data type provided",
    };
  }

  /**
   * Handle duplicate key errors
   * @param {Error} err - Original error
   * @returns {Object} Formatted error
   */
  static _handleDuplicateError(err) {
    let field = "field";
    let value = "value";

    if (err.detail) {
      const match = err.detail.match(/Key \(([^)]+)\)=\(([^)]+)\)/);
      if (match) {
        field = match[1];
        value = match[2];
      }
    }

    return {
      statusCode: 409,
      code: "DUPLICATE_ENTRY",
      message: `${field} '${value}' already exists`,
      details: [
        {
          field: field,
          message: `${field} must be unique`,
        },
      ],
    };
  }

  /**
   * Handle foreign key constraint errors
   * @param {Error} err - Original error
   * @returns {Object} Formatted error
   */
  static _handleForeignKeyError(err) {
    return {
      statusCode: 400,
      code: "FOREIGN_KEY_CONSTRAINT",
      message: "Referenced resource does not exist",
    };
  }

  /**
   * Handle check constraint errors
   * @param {Error} err - Original error
   * @returns {Object} Formatted error
   */
  static _handleCheckConstraintError(err) {
    return {
      statusCode: 400,
      code: "CONSTRAINT_VIOLATION",
      message: "Data violates business rules",
    };
  }

  /**
   * Handle general database constraint errors
   * @param {Error} err - Original error
   * @returns {Object} Formatted error
   */
  static _handleDatabaseConstraintError(err) {
    return {
      statusCode: 400,
      code: "DATABASE_CONSTRAINT",
      message: "Operation violates database constraints",
    };
  }

  /**
   * Handle database connection errors
   * @param {Error} err - Original error
   * @returns {Object} Formatted error
   */
  static _handleDatabaseConnectionError(err) {
    return {
      statusCode: 503,
      code: "DATABASE_UNAVAILABLE",
      message: "Database service temporarily unavailable",
    };
  }

  /**
   * Handle unknown/unexpected errors
   * @param {Error} err - Original error
   * @returns {Object} Formatted error
   */
  static _handleUnknownError(err) {
    return {
      statusCode: 500,
      code: "INTERNAL_SERVER_ERROR",
      message:
        process.env.NODE_ENV === "production"
          ? "Something went wrong"
          : err.message,
    };
  }

  /**
   * Send formatted error response
   * @param {Object} res - Express response object
   * @param {Object} error - Formatted error object
   */
  static _sendErrorResponse(res, error) {
    const response = {
      error: {
        code: error.code,
        message: error.message,
      },
    };

    if (error.details && error.details.length > 0) {
      response.error.details = error.details;
    }

    if (process.env.NODE_ENV === "development" && error.stack) {
      response.error.stack = error.stack;
    }

    res.status(error.statusCode).json(response);
  }

  /**
   * Handle 404 errors for undefined routes
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  static handleNotFound(req, res, next) {
    const error = new NotFoundError(`Route ${req.originalUrl} not found`);
    next(error);
  }

  /**
   * Handle async errors in route handlers
   * @param {Function} fn - Async function to wrap
   * @returns {Function} Wrapped function
   */
  static catchAsync(fn) {
    return (req, res, next) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }
}

module.exports = {
  ErrorHandlerMiddleware,
  AppError,
  ValidationError,
  NotFoundError,
  ConflictError,
  DatabaseError,
  logger,
};
