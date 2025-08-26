/**
 * @typedef {Object} Borrowing
 * @property {number} id - Unique identifier for the borrowing
 * @property {number} borrowerId - ID of the borrower
 * @property {number} bookId - ID of the book
 * @property {Date} checkoutDate - Date when book was checked out
 * @property {Date} dueDate - Date when book is due for return
 * @property {Date|null} returnDate - Date when book was returned (null if not returned)
 * @property {Date} createdAt - Creation timestamp
 * @property {Date} updatedAt - Last update timestamp
 * @property {Object} [book] - Populated book details
 * @property {Object} [borrower] - Populated borrower details
 */

/**
 * @typedef {Object} CreateBorrowingRequest
 * @property {number} borrowerId - ID of the borrower
 * @property {number} bookId - ID of the book
 */

/**
 * @typedef {Object} CheckoutRequest
 * @property {number} borrowerId - ID of the borrower
 * @property {number} bookId - ID of the book
 */

/**
 * @typedef {Object} OverdueBorrowing
 * @property {number} id - Borrowing ID
 * @property {number} borrowerId - Borrower ID
 * @property {number} bookId - Book ID
 * @property {Date} checkoutDate - Checkout date
 * @property {Date} dueDate - Due date
 * @property {number} daysOverdue - Number of days overdue
 * @property {Object} book - Book details
 * @property {Object} borrower - Borrower details
 */

/**
 * Borrowing model class for data transformation and utilities
 */
class Borrowing {
  /**
   * Default loan period in days
   */
  static LOAN_PERIOD_DAYS = 14;

  /**
   * Transform database row to Borrowing model
   * @param {Object} row - Database row object
   * @returns {Borrowing} Transformed borrowing object
   */
  static fromDatabaseRow(row) {
    if (!row) return null;

    return {
      id: row.id,
      borrowerId: row.borrowerId || row.borrower_id,
      bookId: row.bookId || row.book_id,
      checkoutDate: new Date(row.checkoutDate || row.checkout_date),
      dueDate: new Date(row.dueDate || row.due_date),
      returnDate:
        row.returnDate || row.return_date
          ? new Date(row.returnDate || row.return_date)
          : null,
      createdAt: new Date(row.createdAt || row.created_at),
      updatedAt: new Date(row.updatedAt || row.updated_at),
      // Include populated fields if present (Prisma relations)
      ...(row.book && {
        book: {
          id: row.book.id,
          title: row.book.title,
          author: row.book.author,
          isbn: row.book.isbn,
          shelfLocation: row.book.shelfLocation,
        },
      }),
      ...(row.borrower && {
        borrower: {
          id: row.borrower.id,
          name: row.borrower.name,
          email: row.borrower.email,
        },
      }),
      // Include populated fields if present (raw SQL joins)
      ...(row.book_title && {
        book: {
          id: row.book_id || row.bookId,
          title: row.book_title,
          author: row.book_author,
          isbn: row.book_isbn,
          shelfLocation: row.book_shelf_location,
        },
      }),
      ...(row.borrower_name && {
        borrower: {
          id: row.borrower_id || row.borrowerId,
          name: row.borrower_name,
          email: row.borrower_email,
        },
      }),
    };
  }

  /**
   * Transform Borrowing model to database row format
   * @param {CreateBorrowingRequest} borrowingData - Borrowing data object
   * @returns {Object} Database row format
   */
  static toDatabaseRow(borrowingData) {
    const checkoutDate = new Date();
    const dueDate = new Date();
    dueDate.setDate(checkoutDate.getDate() + Borrowing.LOAN_PERIOD_DAYS);

    return {
      borrower_id: borrowingData.borrowerId,
      book_id: borrowingData.bookId,
      checkout_date: checkoutDate,
      due_date: dueDate,
    };
  }

  /**
   * Calculate due date from checkout date
   * @param {Date} checkoutDate - Checkout date
   * @returns {Date} Due date
   */
  static calculateDueDate(checkoutDate = new Date()) {
    const dueDate = new Date(checkoutDate);
    dueDate.setDate(dueDate.getDate() + Borrowing.LOAN_PERIOD_DAYS);
    return dueDate;
  }

  /**
   * Check if borrowing is overdue
   * @param {Borrowing} borrowing - Borrowing object
   * @param {Date} [currentDate] - Current date (defaults to now)
   * @returns {boolean} True if borrowing is overdue
   */
  static isOverdue(borrowing, currentDate = new Date()) {
    if (!borrowing || borrowing.returnDate) return false;
    return borrowing.dueDate < currentDate;
  }

  /**
   * Calculate days overdue
   * @param {Borrowing} borrowing - Borrowing object
   * @param {Date} [currentDate] - Current date (defaults to now)
   * @returns {number} Number of days overdue (0 if not overdue)
   */
  static getDaysOverdue(borrowing, currentDate = new Date()) {
    if (!Borrowing.isOverdue(borrowing, currentDate)) return 0;

    const timeDiff = currentDate.getTime() - borrowing.dueDate.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  }

  /**
   * Check if borrowing is active (not returned)
   * @param {Borrowing} borrowing - Borrowing object
   * @returns {boolean} True if borrowing is active
   */
  static isActive(borrowing) {
    return Boolean(borrowing && !borrowing.returnDate);
  }

  /**
   * Get borrowing status
   * @param {Borrowing} borrowing - Borrowing object
   * @param {Date} [currentDate] - Current date (defaults to now)
   * @returns {string} Status: 'returned', 'overdue', 'active'
   */
  static getStatus(borrowing, currentDate = new Date()) {
    if (!borrowing) return "unknown";
    if (borrowing.returnDate) return "returned";
    if (Borrowing.isOverdue(borrowing, currentDate)) return "overdue";
    return "active";
  }
}

module.exports = Borrowing;
