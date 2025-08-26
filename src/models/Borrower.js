/**
 * @typedef {Object} Borrower
 * @property {number} id - Unique identifier for the borrower
 * @property {string} name - Full name of the borrower
 * @property {string} email - Email address (unique)
 * @property {Date} registeredDate - Date when borrower was registered
 * @property {Date} createdAt - Creation timestamp
 * @property {Date} updatedAt - Last update timestamp
 */

/**
 * @typedef {Object} CreateBorrowerRequest
 * @property {string} name - Full name of the borrower
 * @property {string} email - Email address (unique)
 */

/**
 * @typedef {Object} UpdateBorrowerRequest
 * @property {string} [name] - Full name of the borrower
 * @property {string} [email] - Email address (unique)
 */

/**
 * Borrower model class for data transformation and utilities
 */
class Borrower {
  /**
   * Transform database row to Borrower model
   * @param {Object} row - Database row object
   * @returns {Borrower} Transformed borrower object
   */
  static fromDatabaseRow(row) {
    if (!row) return null;

    return {
      id: row.id,
      name: row.name,
      email: row.email,
      registeredDate: new Date(row.registered_date),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  /**
   * Transform Borrower model to database row format
   * @param {CreateBorrowerRequest|UpdateBorrowerRequest} borrowerData - Borrower data object
   * @returns {Object} Database row format
   */
  static toDatabaseRow(borrowerData) {
    const row = {};

    if (borrowerData.name !== undefined) row.name = borrowerData.name;
    if (borrowerData.email !== undefined)
      row.email = borrowerData.email.toLowerCase();

    return row;
  }

  /**
   * Validate email format
   * @param {string} email - Email to validate
   * @returns {boolean} True if email format is valid
   */
  static isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Normalize email address
   * @param {string} email - Email to normalize
   * @returns {string} Normalized email (lowercase)
   */
  static normalizeEmail(email) {
    return email ? email.toLowerCase().trim() : "";
  }
}

module.exports = Borrower;
