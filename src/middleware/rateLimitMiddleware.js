const rateLimit = require("express-rate-limit");
const logger = require("../config/logger");

/**
 * Rate limiting middleware for book endpoints
 * Limits: 10 requests per 15 minutes per IP
 */
const bookRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: {
    error: {
      code: "RATE_LIMIT_EXCEEDED",
      message: "Too many requests from this IP, please try again later.",
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    logger.warn("Rate limit exceeded", {
      ip: req.ip,
      userAgent: req.get("User-Agent"),
      endpoint: req.originalUrl,
    });
    res.status(429).json(options.message);
  },
});

module.exports = {
  bookRateLimiter,
};
