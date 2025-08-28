const Joi = require("joi");

const commonPatterns = {
  id: Joi.number().integer().positive(),
  email: Joi.string().email().max(255),
  isbn: Joi.string()
    .pattern(/^\d{13}$/)
    .message("ISBN must be exactly 13 digits"),
  positiveInteger: Joi.number().integer().min(0),
  nonEmptyString: Joi.string().trim().min(1).max(255),
  date: Joi.date().iso(),
  pagination: {
    limit: Joi.number().integer().min(1).max(100).default(10),
    offset: Joi.number().integer().min(0).default(0),
  },
};

/**
 * Book validation schemas
 */
const bookSchemas = {
  createBook: Joi.object({
    title: commonPatterns.nonEmptyString.required(),
    author: commonPatterns.nonEmptyString.required(),
    isbn: commonPatterns.isbn.required(),
    totalQuantity: commonPatterns.positiveInteger.min(1).required(),
    shelfLocation: commonPatterns.nonEmptyString.required(),
  }),

  updateBook: Joi.object({
    title: commonPatterns.nonEmptyString,
    author: commonPatterns.nonEmptyString,
    isbn: commonPatterns.isbn,
    totalQuantity: commonPatterns.positiveInteger.min(1),
    shelfLocation: commonPatterns.nonEmptyString,
  }).min(1),

  searchBooks: Joi.object({
    title: Joi.string().trim().min(1).max(255),
    author: Joi.string().trim().min(1).max(255),
    isbn: commonPatterns.isbn,
    limit: commonPatterns.pagination.limit,
    offset: commonPatterns.pagination.offset,
  }),

  bookId: Joi.object({
    id: commonPatterns.id.required(),
  }),

  bookResponse: Joi.object({
    id: commonPatterns.id.required(),
    title: commonPatterns.nonEmptyString.required(),
    author: commonPatterns.nonEmptyString.required(),
    isbn: commonPatterns.isbn.required(),
    totalQuantity: commonPatterns.positiveInteger.required(),
    availableQuantity: commonPatterns.positiveInteger.required(),
    shelfLocation: commonPatterns.nonEmptyString.required(),
    createdAt: commonPatterns.date.required(),
    updatedAt: commonPatterns.date.required(),
  }),
};

/**
 * Borrower validation schemas
 */
const borrowerSchemas = {
  createBorrower: Joi.object({
    name: commonPatterns.nonEmptyString.required(),
    email: commonPatterns.email.required(),
  }),

  updateBorrower: Joi.object({
    name: commonPatterns.nonEmptyString,
    email: commonPatterns.email,
  }).min(1),

  borrowerId: Joi.object({
    id: commonPatterns.id.required(),
  }),

  borrowerResponse: Joi.object({
    id: commonPatterns.id.required(),
    name: commonPatterns.nonEmptyString.required(),
    email: commonPatterns.email.required(),
    registeredDate: commonPatterns.date.required(),
    createdAt: commonPatterns.date.required(),
    updatedAt: commonPatterns.date.required(),
  }),
};

/**
 * Borrowing validation schemas
 */
const borrowingSchemas = {
  checkout: Joi.object({
    borrowerId: commonPatterns.id.required(),
    bookId: commonPatterns.id.required(),
  }),

  returnBook: Joi.object({
    id: commonPatterns.id.required(),
  }),

  borrowingResponse: Joi.object({
    id: commonPatterns.id.required(),
    borrowerId: commonPatterns.id.required(),
    bookId: commonPatterns.id.required(),
    checkoutDate: commonPatterns.date.required(),
    dueDate: commonPatterns.date.required(),
    returnDate: commonPatterns.date.allow(null),
    createdAt: commonPatterns.date.required(),
    updatedAt: commonPatterns.date.required(),
    book: bookSchemas.bookResponse.optional(),
    borrower: borrowerSchemas.borrowerResponse.optional(),
  }),

  overdueBorrowingResponse: Joi.object({
    id: commonPatterns.id.required(),
    borrowerId: commonPatterns.id.required(),
    bookId: commonPatterns.id.required(),
    checkoutDate: commonPatterns.date.required(),
    dueDate: commonPatterns.date.required(),
    daysOverdue: commonPatterns.positiveInteger.required(),
    book: Joi.object({
      id: commonPatterns.id.required(),
      title: commonPatterns.nonEmptyString.required(),
      author: commonPatterns.nonEmptyString.required(),
      isbn: commonPatterns.isbn.required(),
      shelfLocation: commonPatterns.nonEmptyString.required(),
    }).required(),
    borrower: Joi.object({
      id: commonPatterns.id.required(),
      name: commonPatterns.nonEmptyString.required(),
      email: commonPatterns.email.required(),
    }).required(),
  }),
};

/**
 * Common response schemas
 */
const responseSchemas = {
  // Pagination metadata
  paginationMeta: Joi.object({
    total: commonPatterns.positiveInteger.required(),
    limit: commonPatterns.positiveInteger.required(),
    offset: commonPatterns.positiveInteger.required(),
    hasNext: Joi.boolean().required(),
    hasPrevious: Joi.boolean().required(),
  }),

  // Paginated response wrapper
  paginatedResponse: (itemSchema) =>
    Joi.object({
      data: Joi.array().items(itemSchema).required(),
      meta: responseSchemas.paginationMeta.required(),
    }),

  // Error response
  errorResponse: Joi.object({
    error: Joi.object({
      code: Joi.string().required(),
      message: Joi.string().required(),
      details: Joi.array()
        .items(
          Joi.object({
            field: Joi.string(),
            message: Joi.string().required(),
          })
        )
        .optional(),
    }).required(),
  }),

  // Success response with data
  successResponse: (dataSchema) =>
    Joi.object({
      data: dataSchema.required(),
    }),

  // Success response without data (for delete operations)
  successNoContent: Joi.object({
    message: Joi.string().optional(),
  }),
};

/**
 * Query parameter validation schemas
 */
const querySchemas = {
  // Pagination query parameters
  pagination: Joi.object({
    limit: commonPatterns.pagination.limit,
    offset: commonPatterns.pagination.offset,
  }),

  // Book listing with pagination
  bookListing: Joi.object({
    limit: commonPatterns.pagination.limit,
    offset: commonPatterns.pagination.offset,
    search: Joi.string().trim().min(1).max(255).optional(),
  }),

  // Borrower listing with pagination
  borrowerListing: Joi.object({
    limit: commonPatterns.pagination.limit,
    offset: commonPatterns.pagination.offset,
  }),
};

/**
 * Validation helper functions
 */
const validationHelpers = {
  /**
   * Validate request body
   * @param {Object} data - Data to validate
   * @param {Joi.Schema} schema - Joi schema
   * @returns {Object} Validation result
   */
  validateBody: (data, schema) => {
    return schema.validate(data, {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });
  },

  /**
   * Validate query parameters
   * @param {Object} query - Query parameters to validate
   * @param {Joi.Schema} schema - Joi schema
   * @returns {Object} Validation result
   */
  validateQuery: (query, schema) => {
    return schema.validate(query, {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
      allowUnknown: false,
    });
  },

  /**
   * Validate path parameters
   * @param {Object} params - Path parameters to validate
   * @param {Joi.Schema} schema - Joi schema
   * @returns {Object} Validation result
   */
  validateParams: (params, schema) => {
    return schema.validate(params, {
      abortEarly: false,
      convert: true,
    });
  },

  /**
   * Format validation errors for API response
   * @param {Joi.ValidationError} error - Joi validation error
   * @returns {Object} Formatted error object
   */
  formatValidationError: (error) => {
    const details = error.details.map((detail) => ({
      field: detail.path.join("."),
      message: detail.message,
    }));

    return {
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid input data",
        details,
      },
    };
  },
};

module.exports = {
  bookSchemas,
  borrowerSchemas,
  borrowingSchemas,
  responseSchemas,
  querySchemas,
  validationHelpers,
  commonPatterns,
};
