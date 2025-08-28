const logger = require("../config/logger");
const BookRepository = require("../repositories/BookRepository");
const BorrowingRepository = require("../repositories/BorrowingRepository");

/**
 * BookService class for handling book business logic
 */
class BookService {
  constructor(
    bookRepository = BookRepository,
    borrowingRepository = BorrowingRepository
  ) {
    this.bookRepository = bookRepository;
    this.borrowingRepository = borrowingRepository;
  }

  /**
   * Create a new book
   * @param {Object} bookData - Book data to create
   * @param {string} bookData.title - Book title
   * @param {string} bookData.author - Book author
   * @param {string} bookData.isbn - Book ISBN
   * @param {number} bookData.totalQuantity - Total quantity
   * @param {string} bookData.shelfLocation - Shelf location
   * @returns {Promise<Object>} Created book
   * @throws {Error} If validation fails or creation fails
   */
  async createBook(bookData) {
    try {
      logger.debug("BookService: Creating new book", { bookData });

      this._validateBookData(bookData);

      // Validate total quantity is positive
      if (bookData.totalQuantity <= 0) {
        throw new Error("Total quantity must be greater than 0");
      }

      // Set available quantity equal to total quantity for new books
      const bookToCreate = {
        ...bookData,
        availableQuantity: bookData.totalQuantity,
      };

      const createdBook = await this.bookRepository.create(bookToCreate);

      logger.info("BookService: Book created successfully", {
        bookId: createdBook.id,
        title: createdBook.title,
      });

      return createdBook;
    } catch (error) {
      logger.error("BookService: Error creating book", {
        error: error.message,
        bookData,
      });
      throw error;
    }
  }

  /**
   * Update an existing book
   * @param {number} id - Book ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated book
   * @throws {Error} If book not found or validation fails
   */
  async updateBook(id, updateData) {
    try {
      logger.debug("BookService: Updating book", { id, updateData });

      // Check if book exists
      const existingBook = await this.bookRepository.findById(id);
      if (!existingBook) {
        throw new Error("Book not found");
      }

      // Validate update data if provided
      if (
        updateData.title !== undefined ||
        updateData.author !== undefined ||
        updateData.isbn !== undefined ||
        updateData.shelfLocation !== undefined
      ) {
        this._validateBookData(updateData, false);
      }

      // Business rule: Validate quantity changes
      if (updateData.totalQuantity !== undefined) {
        await this._validateQuantityUpdate(
          existingBook,
          updateData.totalQuantity
        );
      }

      const updatedBook = await this.bookRepository.update(id, updateData);

      if (updateData.totalQuantity !== undefined) {
        await this.updateBookAvailability(id);
        // Get the updated book with recalculated availability
        const finalBook = await this.bookRepository.findById(id);
        return finalBook;
      }

      logger.info("BookService: Book updated successfully", {
        bookId: id,
        updatedFields: Object.keys(updateData),
      });

      return updatedBook;
    } catch (error) {
      logger.error("BookService: Error updating book", {
        error: error.message,
        id,
        updateData,
      });
      throw error;
    }
  }

  /**
   * Delete a book
   * Business rule: Cannot delete if there are active borrowings
   * @param {number} id - Book ID
   * @returns {Promise<boolean>} True if deleted successfully
   * @throws {Error} If book has active borrowings or deletion fails
   */
  async deleteBook(id) {
    try {
      logger.debug("BookService: Deleting book", { id });

      // Check if book exists
      const existingBook = await this.bookRepository.findById(id);
      if (!existingBook) {
        throw new Error("Book not found");
      }

      // Business rule: Check for active borrowings
      const activeBorrowings = await this.borrowingRepository.findByBook(id, {
        activeOnly: true,
      });

      if (activeBorrowings.length > 0) {
        throw new Error("Cannot delete book with active borrowings");
      }

      const deleted = await this.bookRepository.delete(id);

      if (deleted) {
        logger.info("BookService: Book deleted successfully", { bookId: id });
      }

      return deleted;
    } catch (error) {
      logger.error("BookService: Error deleting book", {
        error: error.message,
        id,
      });
      throw error;
    }
  }

  /**
   * Get all books with pagination
   * @param {Object} options - Query options
   * @param {number} [options.limit] - Maximum number of results
   * @param {number} [options.offset] - Number of results to skip
   * @returns {Promise<Array>} Array of books
   */
  async getAllBooks(options = {}) {
    try {
      logger.debug("BookService: Getting all books", { options });

      const books = await this.bookRepository.findAll(options);

      logger.debug("BookService: Retrieved books", { count: books.length });

      return books;
    } catch (error) {
      logger.error("BookService: Error getting all books", {
        error: error.message,
        options,
      });
      throw error;
    }
  }

  /**
   * Search books by criteria
   * @param {Object} criteria - Search criteria
   * @param {string} [criteria.title] - Title to search
   * @param {string} [criteria.author] - Author to search
   * @param {string} [criteria.isbn] - ISBN to search
   * @param {number} [criteria.limit] - Maximum number of results
   * @param {number} [criteria.offset] - Number of results to skip
   * @returns {Promise<Array>} Array of matching books
   */
  async searchBooks(criteria = {}) {
    try {
      logger.debug("BookService: Searching books", { criteria });

      const books = await this.bookRepository.search(criteria);

      logger.debug("BookService: Search completed", {
        criteria,
        resultCount: books.length,
      });

      return books;
    } catch (error) {
      logger.error("BookService: Error searching books", {
        error: error.message,
        criteria,
      });
      throw error;
    }
  }

  /**
   * Get a book by ID
   * @param {number} id - Book ID
   * @returns {Promise<Object|null>} Book or null if not found
   */
  async getBookById(id) {
    try {
      logger.debug("BookService: Getting book by ID", { id });

      const book = await this.bookRepository.findById(id);

      if (book) {
        logger.debug("BookService: Book found", { bookId: id });
      } else {
        logger.debug("BookService: Book not found", { id });
      }

      return book;
    } catch (error) {
      logger.error("BookService: Error getting book by ID", {
        error: error.message,
        id,
      });
      throw error;
    }
  }

  /**
   * Check if a book is available for checkout
   * @param {number} bookId - Book ID
   * @returns {Promise<boolean>} True if available
   */
  async isBookAvailable(bookId) {
    try {
      logger.debug("BookService: Checking book availability", { bookId });

      const book = await this.bookRepository.findById(bookId);

      if (!book) {
        return false;
      }

      // Check availability by counting current active borrowings
      const activeBorrowings = await this.borrowingRepository.findByBook(
        bookId,
        {
          activeOnly: true,
        }
      );

      const currentBorrowedQuantity = activeBorrowings.length;
      const availableQuantity = book.totalQuantity - currentBorrowedQuantity;
      const isAvailable = availableQuantity > 0;

      logger.debug("BookService: Book availability check", {
        bookId,
        totalQuantity: book.totalQuantity,
        currentBorrowedQuantity,
        availableQuantity,
        isAvailable,
      });

      return isAvailable;
    } catch (error) {
      logger.error("BookService: Error checking book availability", {
        error: error.message,
        bookId,
      });
      throw error;
    }
  }

  /**
   * Update book availability based on current borrowings
   * @param {number} bookId - Book ID
   * @returns {Promise<Object>} Updated book
   * @throws {Error} If book not found
   */
  async updateBookAvailability(bookId) {
    try {
      logger.debug("BookService: Updating book availability", {
        bookId,
      });

      const book = await this.bookRepository.findById(bookId);

      if (!book) {
        throw new Error("Book not found");
      }

      const updatedBook = await this.bookRepository.updateAvailability(bookId);

      logger.info("BookService: Book availability updated", {
        bookId,
        oldQuantity: book.availableQuantity,
        newQuantity: updatedBook.availableQuantity,
      });

      return updatedBook;
    } catch (error) {
      logger.error("BookService: Error updating book availability", {
        error: error.message,
        bookId,
        quantityChange,
      });
      throw error;
    }
  }

  /**
   * Validate book data
   * @private
   * @param {Object} bookData - Book data to validate
   * @param {boolean} [requireAll=true] - Whether all fields are required
   * @throws {Error} If validation fails
   */
  _validateBookData(bookData, requireAll = true) {
    if (requireAll) {
      if (!bookData.title || typeof bookData.title !== "string") {
        throw new Error("Title is required and must be a string");
      }
      if (!bookData.author || typeof bookData.author !== "string") {
        throw new Error("Author is required and must be a string");
      }
      if (!bookData.isbn || typeof bookData.isbn !== "string") {
        throw new Error("ISBN is required and must be a string");
      }
      if (
        !bookData.shelfLocation ||
        typeof bookData.shelfLocation !== "string"
      ) {
        throw new Error("Shelf location is required and must be a string");
      }
      if (typeof bookData.totalQuantity !== "number") {
        throw new Error("Total quantity is required and must be a number");
      }
    } else {
      // Partial validation for updates
      if (
        bookData.title !== undefined &&
        (!bookData.title || typeof bookData.title !== "string")
      ) {
        throw new Error("Title must be a non-empty string");
      }
      if (
        bookData.author !== undefined &&
        (!bookData.author || typeof bookData.author !== "string")
      ) {
        throw new Error("Author must be a non-empty string");
      }
      if (
        bookData.isbn !== undefined &&
        (!bookData.isbn || typeof bookData.isbn !== "string")
      ) {
        throw new Error("ISBN must be a non-empty string");
      }
      if (
        bookData.shelfLocation !== undefined &&
        (!bookData.shelfLocation || typeof bookData.shelfLocation !== "string")
      ) {
        throw new Error("Shelf location must be a non-empty string");
      }
      if (
        bookData.totalQuantity !== undefined &&
        typeof bookData.totalQuantity !== "number"
      ) {
        throw new Error("Total quantity must be a number");
      }
    }

    // Validate ISBN format (13 digits)
    if (bookData.isbn && !/^\d{13}$/.test(bookData.isbn)) {
      throw new Error("ISBN must be exactly 13 digits");
    }
  }

  /**
   * Validate quantity update business rules
   * @private
   * @param {Object} existingBook - Current book data
   * @param {number} newTotalQuantity - New total quantity
   * @throws {Error} If validation fails
   */
  async _validateQuantityUpdate(existingBook, newTotalQuantity) {
    if (newTotalQuantity <= 0) {
      throw new Error("Total quantity must be greater than 0");
    }

    const borrowedQuantity =
      existingBook.totalQuantity - existingBook.availableQuantity;

    if (newTotalQuantity < borrowedQuantity) {
      throw new Error(
        `Cannot reduce total quantity below borrowed quantity (${borrowedQuantity})`
      );
    }
  }
}

module.exports = BookService;
