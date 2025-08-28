const winston = require("winston");

/**
 * Configure Winston logger for request logging
 */
const requestLogger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: "library-management-system", type: "request" },
  transports: [
    new winston.transports.File({
      filename: "logs/requests.log",
      maxsize: 5242880,
      maxFiles: 5,
    }),
    // Also write to combined log
    new winston.transports.File({
      filename: "logs/combined.log",
      maxsize: 5242880,
      maxFiles: 5,
    }),
  ],
});

if (process.env.NODE_ENV !== "production") {
  requestLogger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          return `${timestamp} [${level}]: ${message} ${
            Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ""
          }`;
        })
      ),
    })
  );
}

/**
 * Request logging middleware
 */
class RequestLoggerMiddleware {
  /**
   * Generate unique request ID
   * @returns {string} Unique request ID
   */
  static generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get client IP address from request
   * @param {Object} req - Express request object
   * @returns {string} Client IP address
   */
  static getClientIP(req) {
    return (
      req.ip ||
      req.connection?.remoteAddress ||
      req.socket?.remoteAddress ||
      (req.connection?.socket ? req.connection.socket.remoteAddress : null) ||
      "unknown"
    );
  }

  /**
   * Get request size in bytes
   * @param {Object} req - Express request object
   * @returns {number} Request size in bytes
   */
  static getRequestSize(req) {
    const contentLength = req.get("content-length");
    return contentLength ? parseInt(contentLength, 10) : 0;
  }

  /**
   * Get response size in bytes
   * @param {Object} res - Express response object
   * @returns {number} Response size in bytes
   */
  static getResponseSize(res) {
    const contentLength = res.get("content-length");
    return contentLength ? parseInt(contentLength, 10) : 0;
  }

  /**
   * Sanitize sensitive data from request body
   * @param {Object} body - Request body
   * @returns {Object} Sanitized body
   */
  static sanitizeBody(body) {
    if (!body || typeof body !== "object") {
      return body;
    }

    const sensitiveFields = ["password", "token", "secret", "key", "auth"];
    const sanitized = { ...body };

    const sanitizeObject = (obj) => {
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          const lowerKey = key.toLowerCase();
          if (typeof obj[key] === "object" && obj[key] !== null) {
            // Recursively sanitize nested objects first
            sanitizeObject(obj[key]);
          } else if (
            sensitiveFields.some((field) => lowerKey.includes(field))
          ) {
            obj[key] = "[REDACTED]";
          }
        }
      }
    };

    sanitizeObject(sanitized);
    return sanitized;
  }

  /**
   * Main request logging middleware
   * @param {Object} options - Configuration options
   * @param {boolean} [options.logBody=false] - Whether to log request body
   * @param {boolean} [options.logQuery=true] - Whether to log query parameters
   * @param {boolean} [options.logHeaders=false] - Whether to log headers
   * @param {Array<string>} [options.skipPaths=[]] - Paths to skip logging
   * @param {Array<string>} [options.skipMethods=[]] - HTTP methods to skip logging
   * @returns {Function} Express middleware function
   */
  static log(options = {}) {
    const {
      logBody = false,
      logQuery = true,
      logHeaders = false,
      skipPaths = [],
      skipMethods = [],
    } = options;

    return (req, res, next) => {
      // Skip logging for specified paths or methods
      if (skipPaths.includes(req.path) || skipMethods.includes(req.method)) {
        return next();
      }

      // Generate unique request ID
      const requestId = RequestLoggerMiddleware.generateRequestId();
      req.id = requestId;

      // Record start time for performance measurement
      const startTime = Date.now();

      // Prepare request log data
      const requestLogData = {
        requestId,
        method: req.method,
        url: req.originalUrl,
        path: req.path,
        ip: RequestLoggerMiddleware.getClientIP(req),
        userAgent: req.get("User-Agent") || "unknown",
        contentType: req.get("Content-Type"),
        contentLength: RequestLoggerMiddleware.getRequestSize(req),
        timestamp: new Date().toISOString(),
      };

      // Add query parameters if enabled
      if (logQuery && Object.keys(req.query).length > 0) {
        requestLogData.query = req.query;
      }

      // Add request body if enabled
      if (logBody && req.body && Object.keys(req.body).length > 0) {
        requestLogData.body = RequestLoggerMiddleware.sanitizeBody(req.body);
      }

      // Add headers if enabled
      if (logHeaders) {
        // Filter out sensitive headers
        const sensitiveHeaders = ["authorization", "cookie", "x-api-key"];
        const filteredHeaders = {};

        for (const [key, value] of Object.entries(req.headers)) {
          if (!sensitiveHeaders.includes(key.toLowerCase())) {
            filteredHeaders[key] = value;
          } else {
            filteredHeaders[key] = "[REDACTED]";
          }
        }

        requestLogData.headers = filteredHeaders;
      }

      // Log incoming request
      requestLogger.info("Incoming request", requestLogData);

      // Override res.end to capture response data
      const originalEnd = res.end;
      const originalSend = res.send;
      const originalJson = res.json;

      let responseBody = null;

      // Capture response body from res.send
      res.send = function (body) {
        responseBody = body;
        return originalSend.call(this, body);
      };

      // Capture response body from res.json
      res.json = function (body) {
        responseBody = body;
        return originalJson.call(this, body);
      };

      // Override res.end to log response
      res.end = function (chunk, encoding) {
        // Calculate response time
        const responseTime = Date.now() - startTime;

        // Prepare response log data
        const responseLogData = {
          requestId,
          method: req.method,
          url: req.originalUrl,
          statusCode: res.statusCode,
          responseTime: `${responseTime}ms`,
          contentLength: RequestLoggerMiddleware.getResponseSize(res),
          timestamp: new Date().toISOString(),
        };

        // Add response body if it's JSON and not too large
        if (responseBody && typeof responseBody === "object") {
          const bodyString = JSON.stringify(responseBody);
          if (bodyString.length < 1000) {
            // Only log small responses
            responseLogData.responseBody = responseBody;
          } else {
            responseLogData.responseBodySize = `${bodyString.length} characters`;
          }
        }

        // Determine log level based on status code
        let logLevel = "info";
        if (res.statusCode >= 500) {
          logLevel = "error";
        } else if (res.statusCode >= 400) {
          logLevel = "warn";
        }

        // Log response
        requestLogger[logLevel]("Request completed", responseLogData);

        // Call original end method
        return originalEnd.call(this, chunk, encoding);
      };

      next();
    };
  }

  /**
   * Simple request logging middleware with minimal configuration
   * @returns {Function} Express middleware function
   */
  static simple() {
    return RequestLoggerMiddleware.log({
      logBody: false,
      logQuery: true,
      logHeaders: false,
      skipPaths: ["/health", "/favicon.ico"],
      skipMethods: [],
    });
  }

  /**
   * Detailed request logging middleware with full configuration
   * @returns {Function} Express middleware function
   */
  static detailed() {
    return RequestLoggerMiddleware.log({
      logBody: true,
      logQuery: true,
      logHeaders: true,
      skipPaths: ["/health", "/favicon.ico"],
      skipMethods: [],
    });
  }

  /**
   * Performance-focused logging middleware
   * @returns {Function} Express middleware function
   */
  static performance() {
    return (req, res, next) => {
      const startTime = process.hrtime.bigint();

      res.on("finish", () => {
        const endTime = process.hrtime.bigint();
        const responseTime = Number(endTime - startTime) / 1000000; // Convert to milliseconds

        const performanceData = {
          method: req.method,
          url: req.originalUrl,
          statusCode: res.statusCode,
          responseTime: `${responseTime.toFixed(2)}ms`,
          timestamp: new Date().toISOString(),
        };

        // Log slow requests as warnings
        if (responseTime > 1000) {
          // Slower than 1 second
          requestLogger.warn("Slow request detected", performanceData);
        } else {
          requestLogger.info("Request performance", performanceData);
        }
      });

      next();
    };
  }

  /**
   * Error request logging middleware
   * @returns {Function} Express middleware function
   */
  static errors() {
    return (req, res, next) => {
      res.on("finish", () => {
        if (res.statusCode >= 400) {
          const errorData = {
            requestId: req.id,
            method: req.method,
            url: req.originalUrl,
            statusCode: res.statusCode,
            ip: RequestLoggerMiddleware.getClientIP(req),
            userAgent: req.get("User-Agent"),
            timestamp: new Date().toISOString(),
          };

          if (res.statusCode >= 500) {
            requestLogger.error("Server error request", errorData);
          } else {
            requestLogger.warn("Client error request", errorData);
          }
        }
      });

      next();
    };
  }
}

module.exports = {
  RequestLoggerMiddleware,
  requestLogger,
};
