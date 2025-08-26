const winston = require("winston");
const BookRepository = require("../repositories/BookRepository");
const BorrowerRepository = require("../repositories/BorrowerRepository");
const BorrowingRepository = require("../repositories/BorrowingRepository");

/**
 * BorrowingService class for handling borrowing
 */
class BorrowingService {
  constructor(
    borrowingRepository = BorrowingRepository,
    bookRepository = BookRepository,
    borrowerRepository = BorrowerRepository
  ) {
    this.borrowingRepository = borrowingRepository;
    this.bookRepository = bookRepository;
    this.borrowerRepository = borrowerRepository;
  }

  /**
   * Check out a book to a borrower
   * @param {number} borrowerId - Borrower ID
   * @param {number} bookId - Book ID
   * @returns {Promise<Object>} Created borrowing record
   * @throws {Error} If checkout fails due to business rules
   */
  async checkoutBook(borrowerId, bookId) {
    try {
      winston.debug("BorrowingService: Checking out book", {
        borrowerId,
        bookId,
      });

      // Validate input parameters
      if (!borrowerId || !bookId) {
        throw new Error("Borrower ID and Book ID are required");
      }

      const borrower = await this.borrowerRepository.findById(borrowerId);
      if (!borrower) {
        throw new Error("Borrower not found");
      }

      const book = await this.bookRepository.findById(bookId);
      if (!book) {
        throw new Error("Book not found");
      }

      // Check if book is available
      if (book.availableQuantity <= 0) {
        throw new Error("Book is not available for checkout");
      }

      const borrowingData = {
        borrowerId: borrowerId,
        bookId: bookId,
      };

      const borrowing = await this.borrowingRepository.create(borrowingData);

      // Update book availability (decrease by 1)
      await this.bookRepository.update(bookId, {
        availableQuantity: book.availableQuantity - 1,
      });

      winston.info("BorrowingService: Book checked out successfully", {
        borrowingId: borrowing.id,
        borrowerId,
        bookId,
        dueDate: borrowing.dueDate,
      });

      return borrowing;
    } catch (error) {
      winston.error("BorrowingService: Error checking out book", {
        error: error.message,
        borrowerId,
        bookId,
      });
      throw error;
    }
  }

  /**
   * Return a book
   * @param {number} borrowingId - Borrowing ID
   * @param {Date} [returnDate] - Return date (defaults to current date)
   * @returns {Promise<Object>} Updated borrowing record
   * @throws {Error} If return fails due to business rules
   */
  async returnBook(borrowingId, returnDate = new Date()) {
    try {
      winston.debug("BorrowingService: Returning book", {
        borrowingId,
        returnDate,
      });

      // Validate input parameters
      if (!borrowingId) {
        throw new Error("Borrowing ID is required");
      }

      // Check if borrowing exists and is active
      const borrowing = await this.borrowingRepository.findById(borrowingId);
      if (!borrowing) {
        throw new Error("Borrowing record not found");
      }

      // Business rule: Check if book is already returned
      if (borrowing.returnDate) {
        throw new Error("Book has already been returned");
      }

      // Update the borrowing record with return date
      const updatedBorrowing = await this.borrowingRepository.update(
        borrowingId,
        {
          returnDate: returnDate,
        }
      );

      // Update book availability (increase by 1)
      const book = await this.bookRepository.findById(borrowing.bookId);
      if (book) {
        await this.bookRepository.update(borrowing.bookId, {
          availableQuantity: book.availableQuantity + 1,
        });
      }

      winston.info("BorrowingService: Book returned successfully", {
        borrowingId,
        bookId: borrowing.bookId,
        borrowerId: borrowing.borrowerId,
        returnDate: returnDate.toISOString(),
      });

      return updatedBorrowing;
    } catch (error) {
      winston.error("BorrowingService: Error returning book", {
        error: error.message,
        borrowingId,
        returnDate,
      });
      throw error;
    }
  }

  /**
   * Get borrower's current books (active borrowings)
   * @param {number} borrowerId - Borrower ID
   * @returns {Promise<Array>} Array of active borrowings with book details
   */
  async getBorrowerCurrentBooks(borrowerId) {
    try {
      winston.debug("BorrowingService: Getting borrower current books", {
        borrowerId,
      });

      // Validate input parameters
      if (!borrowerId) {
        throw new Error("Borrower ID is required");
      }

      // Check if borrower exists
      const borrower = await this.borrowerRepository.findById(borrowerId);
      if (!borrower) {
        throw new Error("Borrower not found");
      }

      // Get active borrowings for the borrower
      const activeBorrowings = await this.borrowingRepository.findByBorrower(
        borrowerId,
        {
          activeOnly: true,
        }
      );

      winston.debug("BorrowingService: Retrieved current books", {
        borrowerId,
        count: activeBorrowings.length,
      });

      return activeBorrowings;
    } catch (error) {
      winston.error("BorrowingService: Error getting borrower current books", {
        error: error.message,
        borrowerId,
      });
      throw error;
    }
  }

  /**
   * Get all overdue books
   * @param {Object} options - Query options
   * @param {Date} [options.asOfDate] - Date to check overdue status (defaults to current date)
   * @param {number} [options.limit] - Maximum number of results
   * @param {number} [options.offset] - Number of results to skip
   * @returns {Promise<Array>} Array of overdue borrowings with book and borrower details
   */
  async getOverdueBooks(options = {}) {
    try {
      winston.debug("BorrowingService: Getting overdue books", { options });

      const asOfDate = options.asOfDate || new Date();

      const overdueBorrowings = await this.borrowingRepository.findOverdue({
        asOfDate,
        limit: options.limit,
        offset: options.offset,
      });

      winston.debug("BorrowingService: Retrieved overdue books", {
        count: overdueBorrowings.length,
        asOfDate: asOfDate.toISOString(),
      });

      return overdueBorrowings;
    } catch (error) {
      winston.error("BorrowingService: Error getting overdue books", {
        error: error.message,
        options,
      });
      throw error;
    }
  }

  /**
   * Get borrowing by ID
   * @param {number} borrowingId - Borrowing ID
   * @returns {Promise<Object|null>} Borrowing record or null if not found
   */
  async getBorrowingById(borrowingId) {
    try {
      winston.debug("BorrowingService: Getting borrowing by ID", {
        borrowingId,
      });

      // Validate input parameters
      if (!borrowingId) {
        throw new Error("Borrowing ID is required");
      }

      const borrowing = await this.borrowingRepository.findById(borrowingId);

      if (borrowing) {
        winston.debug("BorrowingService: Borrowing found", { borrowingId });
      } else {
        winston.debug("BorrowingService: Borrowing not found", { borrowingId });
      }

      return borrowing;
    } catch (error) {
      winston.error("BorrowingService: Error getting borrowing by ID", {
        error: error.message,
        borrowingId,
      });
      throw error;
    }
  }

  /**
   * Check if a borrower can checkout a book
   * @param {number} borrowerId - Borrower ID
   * @param {number} bookId - Book ID
   * @returns {Promise<Object>} Validation result with canCheckout boolean and reason
   */
  async canCheckoutBook(borrowerId, bookId) {
    try {
      winston.debug(
        "BorrowingService: Checking if borrower can checkout book",
        {
          borrowerId,
          bookId,
        }
      );

      const result = {
        canCheckout: false,
        reason: null,
      };

      const borrower = await this.borrowerRepository.findById(borrowerId);
      if (!borrower) {
        result.reason = "Borrower not found";
        return result;
      }

      const book = await this.bookRepository.findById(bookId);
      if (!book) {
        result.reason = "Book not found";
        return result;
      }

      // Check if book is available
      if (book.availableQuantity <= 0) {
        result.reason = "Book is not available for checkout";
        return result;
      }

      result.canCheckout = true;
      winston.debug("BorrowingService: Checkout validation passed", {
        borrowerId,
        bookId,
      });

      return result;
    } catch (error) {
      winston.error("BorrowingService: Error checking checkout eligibility", {
        error: error.message,
        borrowerId,
        bookId,
      });
      throw error;
    }
  }

  /**
   * Get borrowing statistics
   * @returns {Promise<Object>} Statistics about borrowings
   */
  async getBorrowingStatistics() {
    try {
      winston.debug("BorrowingService: Getting borrowing statistics");

      const statistics = await this.borrowingRepository.getStatistics();

      winston.debug(
        "BorrowingService: Retrieved borrowing statistics",
        statistics
      );

      return statistics;
    } catch (error) {
      winston.error("BorrowingService: Error getting borrowing statistics", {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Extend due date for a borrowing
   * @param {number} borrowingId - Borrowing ID
   * @param {number} extensionDays - Number of days to extend
   * @returns {Promise<Object>} Updated borrowing record
   * @throws {Error} If extension fails due to business rules
   */
  async extendDueDate(borrowingId, extensionDays) {
    try {
      winston.debug("BorrowingService: Extending due date", {
        borrowingId,
        extensionDays,
      });

      if (!borrowingId || !extensionDays || extensionDays <= 0) {
        throw new Error(
          "Valid borrowing ID and positive extension days are required"
        );
      }

      const borrowing = await this.borrowingRepository.findById(borrowingId);
      if (!borrowing) {
        throw new Error("Borrowing record not found");
      }

      // Cannot extend if already returned
      if (borrowing.returnDate) {
        throw new Error("Cannot extend due date for returned book");
      }

      // Calculate new due date
      const currentDueDate = new Date(borrowing.dueDate);
      const newDueDate = new Date(
        currentDueDate.getTime() + extensionDays * 24 * 60 * 60 * 1000
      );

      // Update the borrowing record
      const updatedBorrowing = await this.borrowingRepository.update(
        borrowingId,
        {
          dueDate: newDueDate,
        }
      );

      winston.info("BorrowingService: Due date extended successfully", {
        borrowingId,
        oldDueDate: currentDueDate.toISOString(),
        newDueDate: newDueDate.toISOString(),
        extensionDays,
      });

      return updatedBorrowing;
    } catch (error) {
      winston.error("BorrowingService: Error extending due date", {
        error: error.message,
        borrowingId,
        extensionDays,
      });
      throw error;
    }
  }

  /**
   * Check if a book is currently borrowed by a specific borrower
   * @param {number} borrowerId - Borrower ID
   * @param {number} bookId - Book ID
   * @returns {Promise<Object|null>} Active borrowing record or null if not found
   */
  async isBookBorrowedByBorrower(borrowerId, bookId) {
    try {
      winston.debug(
        "BorrowingService: Checking if book is borrowed by borrower",
        {
          borrowerId,
          bookId,
        }
      );

      // Get active borrowings for the borrower
      const activeBorrowings = await this.borrowingRepository.findByBorrower(
        borrowerId,
        {
          activeOnly: true,
        }
      );

      // Find borrowing for the specific book
      const bookBorrowing = activeBorrowings.find(
        (borrowing) => borrowing.bookId === bookId
      );

      if (bookBorrowing) {
        winston.debug(
          "BorrowingService: Book is currently borrowed by borrower",
          {
            borrowerId,
            bookId,
            borrowingId: bookBorrowing.id,
          }
        );
      } else {
        winston.debug(
          "BorrowingService: Book is not currently borrowed by borrower",
          {
            borrowerId,
            bookId,
          }
        );
      }

      return bookBorrowing || null;
    } catch (error) {
      winston.error(
        "BorrowingService: Error checking if book is borrowed by borrower",
        {
          error: error.message,
          borrowerId,
          bookId,
        }
      );
      throw error;
    }
  }
}

module.exports = BorrowingService;
