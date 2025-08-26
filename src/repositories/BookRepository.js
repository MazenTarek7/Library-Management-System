const prisma = require("../config/prisma");
const winston = require("winston");
const Book = require("../models/Book");

/**
 * BookRepository class for handling book data operations using Prisma
 */
class BookRepository {
  /**
   * Create a new book
   * @param {Object} bookData - Book data to create
   * @param {string} bookData.title - Book title
   * @param {string} bookData.author - Book author
   * @param {string} bookData.isbn - Book ISBN
   * @param {number} bookData.totalQuantity - Total quantity
   * @param {string} bookData.shelfLocation - Shelf location
   * @returns {Promise<Object>} Created book
   */
  static async create(bookData) {
    try {
      winston.debug("Creating new book", { bookData });

      const dbData = Book.toDatabaseRow(bookData);

      const createdBook = await prisma.book.create({
        data: {
          title: dbData.title,
          author: dbData.author,
          isbn: dbData.isbn,
          totalQuantity: dbData.total_quantity,
          availableQuantity: dbData.available_quantity,
          shelfLocation: dbData.shelf_location,
        },
      });

      winston.info("Book created successfully", { bookId: createdBook.id });
      return Book.fromDatabaseRow(createdBook);
    } catch (error) {
      winston.error("Error creating book", { error: error.message, bookData });
      throw error;
    }
  }

  /**
   * Update an existing book
   * @param {number} id - Book ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object|null>} Updated book or null if not found
   */
  static async update(id, updateData) {
    try {
      winston.debug("Updating book", { id, updateData });

      const updateFields = {};

      if (updateData.title !== undefined) updateFields.title = updateData.title;
      if (updateData.author !== undefined)
        updateFields.author = updateData.author;
      if (updateData.isbn !== undefined) updateFields.isbn = updateData.isbn;
      if (updateData.totalQuantity !== undefined)
        updateFields.totalQuantity = updateData.totalQuantity;
      if (updateData.availableQuantity !== undefined)
        updateFields.availableQuantity = updateData.availableQuantity;
      if (updateData.shelfLocation !== undefined)
        updateFields.shelfLocation = updateData.shelfLocation;

      const updatedBook = await prisma.book.update({
        where: { id },
        data: updateFields,
      });

      winston.info("Book updated successfully", { bookId: id });
      return Book.fromDatabaseRow(updatedBook);
    } catch (error) {
      if (error.code === "P2025") {
        winston.warn("Book not found for update", { id });
        return null;
      }
      winston.error("Error updating book", {
        error: error.message,
        id,
        updateData,
      });
      throw error;
    }
  }

  /**
   * Delete a book
   * @param {number} id - Book ID
   * @returns {Promise<boolean>} True if deleted, false if not found
   */
  static async delete(id) {
    try {
      winston.debug("Deleting book", { id });

      await prisma.book.delete({
        where: { id },
      });

      winston.info("Book deleted successfully", { bookId: id });
      return true;
    } catch (error) {
      if (error.code === "P2025") {
        winston.warn("Book not found for deletion", { id });
        return false;
      }
      winston.error("Error deleting book", { error: error.message, id });
      throw error;
    }
  }

  /**
   * Find a book by ID
   * @param {number} id - Book ID
   * @returns {Promise<Object|null>} Book or null if not found
   */
  static async findById(id) {
    try {
      winston.debug("Finding book by ID", { id });

      const book = await prisma.book.findUnique({
        where: { id },
      });

      if (book) {
        winston.debug("Book found", { bookId: id });
        return Book.fromDatabaseRow(book);
      } else {
        winston.debug("Book not found", { id });
        return null;
      }
    } catch (error) {
      winston.error("Error finding book by ID", { error: error.message, id });
      throw error;
    }
  }

  /**
   * Find all books with optional pagination
   * @param {Object} options - Query options
   * @param {number} [options.limit] - Maximum number of results
   * @param {number} [options.offset] - Number of results to skip
   * @returns {Promise<Array>} Array of books
   */
  static async findAll(options = {}) {
    try {
      winston.debug("Finding all books", { options });

      const queryOptions = {};

      if (options.limit) {
        queryOptions.take = options.limit;
      }

      if (options.offset) {
        queryOptions.skip = options.offset;
      }

      const books = await prisma.book.findMany(queryOptions);

      winston.debug("Books retrieved", { count: books.length });
      return books.map((book) => Book.fromDatabaseRow(book));
    } catch (error) {
      winston.error("Error finding all books", {
        error: error.message,
        options,
      });
      throw error;
    }
  }

  /**
   * Search books by title, author, or ISBN
   * @param {Object} criteria - Search criteria
   * @param {string} [criteria.title] - Title to search (partial match)
   * @param {string} [criteria.author] - Author to search (partial match)
   * @param {string} [criteria.isbn] - ISBN to search (exact match)
   * @param {number} [criteria.limit] - Maximum number of results
   * @param {number} [criteria.offset] - Number of results to skip
   * @returns {Promise<Array>} Array of matching books
   */
  static async search(criteria = {}) {
    try {
      winston.debug("Searching books", { criteria });

      const where = {};

      if (criteria.title) {
        where.title = {
          contains: criteria.title,
          mode: "insensitive",
        };
      }

      if (criteria.author) {
        where.author = {
          contains: criteria.author,
          mode: "insensitive",
        };
      }

      if (criteria.isbn) {
        where.isbn = criteria.isbn;
      }

      const queryOptions = { where };

      if (criteria.limit) {
        queryOptions.take = criteria.limit;
      }

      if (criteria.offset) {
        queryOptions.skip = criteria.offset;
      }

      const books = await prisma.book.findMany(queryOptions);

      winston.debug("Book search completed", {
        criteria,
        resultCount: books.length,
      });

      return books.map((book) => Book.fromDatabaseRow(book));
    } catch (error) {
      winston.error("Error searching books", {
        error: error.message,
        criteria,
      });
      throw error;
    }
  }
}

module.exports = BookRepository;
