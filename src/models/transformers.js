const Book = require("./Book");
const Borrower = require("./Borrower");
const Borrowing = require("./Borrowing");

/**
 * Collection of transformation utilities for converting between different data formats
 */
class ModelTransformers {
  /**
   * Transform multiple database rows to model objects
   * @param {Array} rows - Array of database rows
   * @param {Function} transformer - Transformation function
   * @returns {Array} Array of transformed objects
   */
  static transformMany(rows, transformer) {
    if (!Array.isArray(rows)) return [];
    return rows.map((row) => transformer(row)).filter((item) => item !== null);
  }

  /**
   * Transform paginated database result
   * @param {Object} result - Database result with rows and count
   * @param {Function} transformer - Transformation function
   * @param {number} limit - Page limit
   * @param {number} offset - Page offset
   * @returns {Object} Paginated response object
   */
  static transformPaginated(result, transformer, limit, offset) {
    const { rows, count } = result;
    const total = parseInt(count) || 0;

    return {
      data: ModelTransformers.transformMany(rows, transformer),
      meta: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasNext: offset + limit < total,
        hasPrevious: offset > 0,
      },
    };
  }

  /**
   * Book transformation utilities
   */
  static book = {
    /**
     * Transform single book database row
     * @param {Object} row - Database row
     * @returns {Object|null} Transformed book object
     */
    fromRow: (row) => Book.fromDatabaseRow(row),

    /**
     * Transform multiple book database rows
     * @param {Array} rows - Array of database rows
     * @returns {Array} Array of transformed book objects
     */
    fromRows: (rows) =>
      ModelTransformers.transformMany(rows, Book.fromDatabaseRow),

    /**
     * Transform book data for database insertion/update
     * @param {Object} bookData - Book data object
     * @returns {Object} Database row format
     */
    toRow: (bookData) => Book.toDatabaseRow(bookData),

    /**
     * Transform paginated book results
     * @param {Object} result - Database result with rows and count
     * @param {number} limit - Page limit
     * @param {number} offset - Page offset
     * @returns {Object} Paginated book response
     */
    paginated: (result, limit, offset) =>
      ModelTransformers.transformPaginated(
        result,
        Book.fromDatabaseRow,
        limit,
        offset
      ),

    /**
     * Transform book for API response (add computed fields)
     * @param {Object} book - Book object
     * @returns {Object} Enhanced book object for API response
     */
    forResponse: (book) => {
      if (!book) return null;

      return {
        ...book,
        availabilityStatus: Book.getAvailabilityStatus(book),
        isAvailable: Book.isAvailable(book),
      };
    },
  };

  /**
   * Borrower transformation utilities
   */
  static borrower = {
    /**
     * Transform single borrower database row
     * @param {Object} row - Database row
     * @returns {Object|null} Transformed borrower object
     */
    fromRow: (row) => Borrower.fromDatabaseRow(row),

    /**
     * Transform multiple borrower database rows
     * @param {Array} rows - Array of database rows
     * @returns {Array} Array of transformed borrower objects
     */
    fromRows: (rows) =>
      ModelTransformers.transformMany(rows, Borrower.fromDatabaseRow),

    /**
     * Transform borrower data for database insertion/update
     * @param {Object} borrowerData - Borrower data object
     * @returns {Object} Database row format
     */
    toRow: (borrowerData) => Borrower.toDatabaseRow(borrowerData),

    /**
     * Transform paginated borrower results
     * @param {Object} result - Database result with rows and count
     * @param {number} limit - Page limit
     * @param {number} offset - Page offset
     * @returns {Object} Paginated borrower response
     */
    paginated: (result, limit, offset) =>
      ModelTransformers.transformPaginated(
        result,
        Borrower.fromDatabaseRow,
        limit,
        offset
      ),

    /**
     * Transform borrower for API response (sanitize sensitive data)
     * @param {Object} borrower - Borrower object
     * @returns {Object} Sanitized borrower object for API response
     */
    forResponse: (borrower) => {
      if (!borrower) return null;

      // For now, return all fields, but this could be used to hide sensitive data
      return {
        ...borrower,
      };
    },
  };

  /**
   * Borrowing transformation utilities
   */
  static borrowing = {
    /**
     * Transform single borrowing database row
     * @param {Object} row - Database row
     * @returns {Object|null} Transformed borrowing object
     */
    fromRow: (row) => Borrowing.fromDatabaseRow(row),

    /**
     * Transform multiple borrowing database rows
     * @param {Array} rows - Array of database rows
     * @returns {Array} Array of transformed borrowing objects
     */
    fromRows: (rows) =>
      ModelTransformers.transformMany(rows, Borrowing.fromDatabaseRow),

    /**
     * Transform borrowing data for database insertion
     * @param {Object} borrowingData - Borrowing data object
     * @returns {Object} Database row format
     */
    toRow: (borrowingData) => Borrowing.toDatabaseRow(borrowingData),

    /**
     * Transform borrowing for API response (add computed fields)
     * @param {Object} borrowing - Borrowing object
     * @param {Date} [currentDate] - Current date for calculations
     * @returns {Object} Enhanced borrowing object for API response
     */
    forResponse: (borrowing, currentDate = new Date()) => {
      if (!borrowing) return null;

      return {
        ...borrowing,
        status: Borrowing.getStatus(borrowing, currentDate),
        isOverdue: Borrowing.isOverdue(borrowing, currentDate),
        daysOverdue: Borrowing.getDaysOverdue(borrowing, currentDate),
        isActive: Borrowing.isActive(borrowing),
      };
    },

    /**
     * Transform borrowing to overdue borrowing format
     * @param {Object} borrowing - Borrowing object with populated book and borrower
     * @param {Date} [currentDate] - Current date for calculations
     * @returns {Object|null} Overdue borrowing object or null if not overdue
     */
    toOverdue: (borrowing, currentDate = new Date()) => {
      if (!borrowing || !Borrowing.isOverdue(borrowing, currentDate)) {
        return null;
      }

      return {
        id: borrowing.id,
        borrowerId: borrowing.borrowerId,
        bookId: borrowing.bookId,
        checkoutDate: borrowing.checkoutDate,
        dueDate: borrowing.dueDate,
        daysOverdue: Borrowing.getDaysOverdue(borrowing, currentDate),
        book: borrowing.book
          ? {
              id: borrowing.book.id,
              title: borrowing.book.title,
              author: borrowing.book.author,
              isbn: borrowing.book.isbn,
              shelfLocation: borrowing.book.shelfLocation,
            }
          : null,
        borrower: borrowing.borrower
          ? {
              id: borrowing.borrower.id,
              name: borrowing.borrower.name,
              email: borrowing.borrower.email,
            }
          : null,
      };
    },

    /**
     * Transform multiple borrowings to overdue format
     * @param {Array} borrowings - Array of borrowing objects
     * @param {Date} [currentDate] - Current date for calculations
     * @returns {Array} Array of overdue borrowing objects
     */
    toOverdueMany: (borrowings, currentDate = new Date()) => {
      if (!Array.isArray(borrowings)) return [];

      return borrowings
        .map((borrowing) =>
          ModelTransformers.borrowing.toOverdue(borrowing, currentDate)
        )
        .filter((overdue) => overdue !== null);
    },
  };

  /**
   * Generic transformation utilities
   */
  static generic = {
    /**
     * Transform database error to API error format
     * @param {Error} error - Database error
     * @returns {Object} API error object
     */
    dbErrorToApiError: (error) => {
      // Handle specific PostgreSQL error codes
      if (error.code === "23505") {
        // Unique constraint violation
        const match = error.detail?.match(
          /Key \((.+)\)=\((.+)\) already exists/
        );
        const field = match ? match[1] : "field";

        return {
          error: {
            code: "DUPLICATE_VALUE",
            message: `${field} already exists`,
            details: [
              {
                field,
                message: `This ${field} is already in use`,
              },
            ],
          },
        };
      }

      if (error.code === "23503") {
        // Foreign key constraint violation
        return {
          error: {
            code: "REFERENCE_ERROR",
            message: "Referenced record does not exist",
            details: [
              {
                field: "reference",
                message: "The referenced record was not found",
              },
            ],
          },
        };
      }

      if (error.code === "23514") {
        // Check constraint violation
        return {
          error: {
            code: "CONSTRAINT_VIOLATION",
            message: "Data violates database constraints",
            details: [
              {
                field: "constraint",
                message:
                  error.detail || "Data does not meet required constraints",
              },
            ],
          },
        };
      }

      // Generic database error
      return {
        error: {
          code: "DATABASE_ERROR",
          message: "An error occurred while processing your request",
        },
      };
    },

    /**
     * Create success response wrapper
     * @param {*} data - Response data
     * @param {string} [message] - Optional success message
     * @returns {Object} Success response object
     */
    successResponse: (data, message) => {
      const response = { data };
      if (message) response.message = message;
      return response;
    },

    /**
     * Create error response wrapper
     * @param {string} code - Error code
     * @param {string} message - Error message
     * @param {Array} [details] - Optional error details
     * @returns {Object} Error response object
     */
    errorResponse: (code, message, details) => {
      const error = { code, message };
      if (details && details.length > 0) error.details = details;
      return { error };
    },
  };
}

module.exports = ModelTransformers;
