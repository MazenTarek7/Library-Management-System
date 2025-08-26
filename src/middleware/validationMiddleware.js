const { validationHelpers } = require("../models/validation");

/**
 * Validation middleware factory
 * Creates middleware functions for validating different parts of HTTP requests
 */
class ValidationMiddleware {
  /**
   * Create middleware to validate request body
   * @param {Joi.Schema} schema - Joi schema for validation
   * @returns {Function} Express middleware function
   */
  static validateBody(schema) {
    return (req, res, next) => {
      const { error, value } = validationHelpers.validateBody(req.body, schema);

      if (error) {
        const formattedError = validationHelpers.formatValidationError(error);
        return res.status(400).json(formattedError);
      }

      // Replace request body with validated and sanitized data
      req.body = value;
      next();
    };
  }

  /**
   * Create middleware to validate query parameters
   * @param {Joi.Schema} schema - Joi schema for validation
   * @returns {Function} Express middleware function
   */
  static validateQuery(schema) {
    return (req, res, next) => {
      const { error, value } = validationHelpers.validateQuery(
        req.query,
        schema
      );

      if (error) {
        const formattedError = validationHelpers.formatValidationError(error);
        return res.status(400).json(formattedError);
      }

      // Replace query parameters with validated and sanitized data
      req.query = value;
      next();
    };
  }

  /**
   * Create middleware to validate path parameters
   * @param {Joi.Schema} schema - Joi schema for validation
   * @returns {Function} Express middleware function
   */
  static validateParams(schema) {
    return (req, res, next) => {
      const { error, value } = validationHelpers.validateParams(
        req.params,
        schema
      );

      if (error) {
        const formattedError = validationHelpers.formatValidationError(error);
        return res.status(400).json(formattedError);
      }

      // Replace path parameters with validated and sanitized data
      req.params = value;
      next();
    };
  }

  /**
   * Create middleware to validate multiple request parts
   * @param {Object} schemas - Object containing schemas for different parts
   * @param {Joi.Schema} [schemas.body] - Schema for request body
   * @param {Joi.Schema} [schemas.query] - Schema for query parameters
   * @param {Joi.Schema} [schemas.params] - Schema for path parameters
   * @returns {Function} Express middleware function
   */
  static validate(schemas = {}) {
    return (req, res, next) => {
      const errors = [];

      // Validate body if schema provided
      if (schemas.body) {
        const { error, value } = validationHelpers.validateBody(
          req.body,
          schemas.body
        );
        if (error) {
          errors.push(...error.details);
        } else {
          req.body = value;
        }
      }

      // Validate query parameters if schema provided
      if (schemas.query) {
        const { error, value } = validationHelpers.validateQuery(
          req.query,
          schemas.query
        );
        if (error) {
          errors.push(...error.details);
        } else {
          req.query = value;
        }
      }

      // Validate path parameters if schema provided
      if (schemas.params) {
        const { error, value } = validationHelpers.validateParams(
          req.params,
          schemas.params
        );
        if (error) {
          errors.push(...error.details);
        } else {
          req.params = value;
        }
      }

      // If any validation errors occurred, return formatted error response
      if (errors.length > 0) {
        const formattedError = validationHelpers.formatValidationError({
          details: errors,
        });
        return res.status(400).json(formattedError);
      }

      next();
    };
  }

  /**
   * Create middleware to validate request content type
   * @param {string|Array<string>} allowedTypes - Allowed content types
   * @returns {Function} Express middleware function
   */
  static validateContentType(allowedTypes) {
    const types = Array.isArray(allowedTypes) ? allowedTypes : [allowedTypes];

    return (req, res, next) => {
      if (
        req.method === "GET" ||
        req.method === "DELETE" ||
        !req.body ||
        Object.keys(req.body).length === 0
      ) {
        return next();
      }

      const contentType = req.get("Content-Type");

      if (!contentType) {
        return res.status(400).json({
          error: {
            code: "MISSING_CONTENT_TYPE",
            message: "Content-Type header is required",
          },
        });
      }

      const isValidType = types.some((type) => contentType.includes(type));

      if (!isValidType) {
        return res.status(400).json({
          error: {
            code: "INVALID_CONTENT_TYPE",
            message: `Content-Type must be one of: ${types.join(", ")}`,
            details: [
              {
                field: "Content-Type",
                message: `Received: ${contentType}`,
              },
            ],
          },
        });
      }

      next();
    };
  }
}

module.exports = ValidationMiddleware;
