/**
 * @typedef {Object} Book
 * @property {number} id - Unique identifier for the book
 * @property {string} title - Title of the book
 * @property {string} author - Author of the book
 * @property {string} isbn - ISBN number (13 digits)
 * @property {number} totalQuantity - Total number of copies
 * @property {number} availableQuantity - Number of available copies
 * @property {string} shelfLocation - Physical location in library
 * @property {Date} createdAt - Creation timestamp
 * @property {Date} updatedAt - Last update timestamp
 */

/**
 * @typedef {Object} CreateBookRequest
 * @property {string} title - Title of the book
 * @property {string} author - Author of the book
 * @property {string} isbn - ISBN number (13 digits)
 * @property {number} totalQuantity - Total number of copies
 * @property {string} shelfLocation - Physical location in library
 */

/**
 * @typedef {Object} UpdateBookRequest
 * @property {string} [title] - Title of the book
 * @property {string} [author] - Author of the book
 * @property {string} [isbn] - ISBN number (13 digits)
 * @property {number} [totalQuantity] - Total number of copies
 * @property {string} [shelfLocation] - Physical location in library
 */

/**
 * @typedef {Object} BookSearchCriteria
 * @property {string} [title] - Search by title (partial match)
 * @property {string} [author] - Search by author (partial match)
 * @property {string} [isbn] - Search by ISBN (exact match)
 * @property {number} [limit] - Maximum number of results
 * @property {number} [offset] - Number of results to skip
 */

/**
 * Book model class for data transformation and utilities
 */
class Book {
  /**
   * Transform database row to Book model
   * @param {Object} row - Database row object
   * @returns {Book} Transformed book object
   */
  static fromDatabaseRow(row) {
    if (!row) return null;

    return {
      id: row.id,
      title: row.title,
      author: row.author,
      isbn: row.isbn,
      totalQuantity: row.total_quantity,
      availableQuantity: row.available_quantity,
      shelfLocation: row.shelf_location,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  /**
   * Transform Book model to database row format
   * @param {CreateBookRequest|UpdateBookRequest} bookData - Book data object
   * @returns {Object} Database row format
   */
  static toDatabaseRow(bookData) {
    const row = {};

    if (bookData.title !== undefined) row.title = bookData.title;
    if (bookData.author !== undefined) row.author = bookData.author;
    if (bookData.isbn !== undefined) row.isbn = bookData.isbn;
    if (bookData.totalQuantity !== undefined) {
      row.total_quantity = bookData.totalQuantity;
      // new books
      if (bookData.availableQuantity === undefined) {
        row.available_quantity = bookData.totalQuantity;
      }
    }
    if (bookData.availableQuantity !== undefined) {
      row.available_quantity = bookData.availableQuantity;
    }
    if (bookData.shelfLocation !== undefined)
      row.shelf_location = bookData.shelfLocation;

    return row;
  }

  /**
   * Check if book is available for checkout
   * @param {Book} book - Book object
   * @returns {boolean} True if book is available
   */
  static isAvailable(book) {
    return Boolean(book && book.availableQuantity > 0);
  }

  /**
   * Calculate availability status
   * @param {Book} book - Book object
   * @returns {string} Availability status
   */
  static getAvailabilityStatus(book) {
    if (!book) return "unknown";
    if (book.availableQuantity === 0) return "unavailable";
    if (book.availableQuantity < book.totalQuantity)
      return "partially_available";
    return "available";
  }
}

module.exports = Book;
