const logger = require("../config/logger");

const VALID_USERNAME = "admin";
const VALID_PASSWORD = "admin";

/**
 * Basic authentication middleware for book endpoints
 * Validates username and password from Authorization header
 */
const basicAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      logger.warn("Missing Authorization header", {
        ip: req.ip,
        endpoint: req.originalUrl,
      });
      return res.status(401).json({
        error: {
          code: "AUTHENTICATION_REQUIRED",
          message: "Authentication required. Please provide valid credentials.",
        },
      });
    }

    if (!authHeader.startsWith("Basic ")) {
      logger.warn("Invalid Authorization header format", {
        ip: req.ip,
        endpoint: req.originalUrl,
        authHeader: authHeader.substring(0, 20) + "...",
      });
      return res.status(401).json({
        error: {
          code: "INVALID_AUTH_FORMAT",
          message: "Invalid authentication format. Use Basic authentication.",
        },
      });
    }

    const base64Credentials = authHeader.split(" ")[1];
    const credentials = Buffer.from(base64Credentials, "base64").toString(
      "utf-8"
    );
    const [username, password] = credentials.split(":");

    if (username === VALID_USERNAME && password === VALID_PASSWORD) {
      logger.debug("Authentication successful", {
        ip: req.ip,
        username,
        endpoint: req.originalUrl,
      });
      next();
    } else {
      logger.warn("Authentication failed", {
        ip: req.ip,
        username,
        endpoint: req.originalUrl,
      });
      return res.status(401).json({
        error: {
          code: "INVALID_CREDENTIALS",
          message: "Invalid username or password.",
        },
      });
    }
  } catch (error) {
    logger.error("Authentication middleware error", {
      error: error.message,
      ip: req.ip,
      endpoint: req.originalUrl,
    });
    return res.status(500).json({
      error: {
        code: "AUTHENTICATION_ERROR",
        message: "Authentication service error.",
      },
    });
  }
};

module.exports = {
  basicAuth,
};
