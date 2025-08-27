const winston = require("winston");
const BookService = require("../services/BookService");

class BookController {
  constructor(bookService = new BookService()) {
    this.bookService = bookService;
  }

  /**
   * GET /api/books - Get all books with pagination and search
   */
  async getAllBooks(req, res, next) {
    try {
      winston.debug("BookController: Getting all books", {
        query: req.query,
      });

      const { limit, offset, search } = req.query;

      let books;
      if (search) {
        // If search parameter provided, use search functionality
        books = await this.bookService.searchBooks({
          title: search,
          author: search,
          limit,
          offset,
        });
      } else {
        books = await this.bookService.getAllBooks({
          limit,
          offset,
        });
      }

      winston.info("BookController: Books retrieved successfully", {
        count: books.length,
        hasSearch: !!search,
      });

      res.status(200).json({
        data: books,
        meta: {
          total: books.length,
          limit: limit || 10,
          offset: offset || 0,
          hasNext: books.length === (limit || 10),
          hasPrevious: (offset || 0) > 0,
        },
      });
    } catch (error) {
      winston.error("BookController: Error getting all books", {
        error: error.message,
        query: req.query,
      });
      next(error);
    }
  }

  /**
   * GET /api/books/:id - Get a specific book by ID
   */
  async getBookById(req, res, next) {
    try {
      const { id } = req.params;

      winston.debug("BookController: Getting book by ID", { id });

      const book = await this.bookService.getBookById(parseInt(id));

      if (!book) {
        winston.info("BookController: Book not found", { id });
        return res.status(404).json({
          error: {
            code: "BOOK_NOT_FOUND",
            message: "Book not found",
          },
        });
      }

      winston.info("BookController: Book retrieved successfully", {
        bookId: id,
        title: book.title,
      });

      res.status(200).json({
        data: book,
      });
    } catch (error) {
      winston.error("BookController: Error getting book by ID", {
        error: error.message,
        id: req.params.id,
      });
      next(error);
    }
  }

  /**
   * POST /api/books - Create a new book
   */
  async createBook(req, res, next) {
    try {
      winston.debug("BookController: Creating new book", {
        bookData: req.body,
      });

      const createdBook = await this.bookService.createBook(req.body);

      winston.info("BookController: Book created successfully", {
        bookId: createdBook.id,
        title: createdBook.title,
      });

      res.status(201).json({
        data: createdBook,
      });
    } catch (error) {
      winston.error("BookController: Error creating book", {
        error: error.message,
        bookData: req.body,
      });

      if (error.message.includes("ISBN")) {
        return res.status(400).json({
          error: {
            code: "INVALID_ISBN",
            message: error.message,
          },
        });
      }

      if (error.message.includes("quantity")) {
        return res.status(400).json({
          error: {
            code: "INVALID_QUANTITY",
            message: error.message,
          },
        });
      }

      // Handle duplicate ISBN constraint
      if (
        error.message.includes("duplicate") ||
        error.message.includes("unique")
      ) {
        return res.status(409).json({
          error: {
            code: "DUPLICATE_ISBN",
            message: "A book with this ISBN already exists",
          },
        });
      }

      next(error);
    }
  }

  /**
   * PUT /api/books/:id - Update an existing book
   */
  async updateBook(req, res, next) {
    try {
      const { id } = req.params;

      winston.debug("BookController: Updating book", {
        id,
        updateData: req.body,
      });

      const updatedBook = await this.bookService.updateBook(
        parseInt(id),
        req.body
      );

      winston.info("BookController: Book updated successfully", {
        bookId: id,
        updatedFields: Object.keys(req.body),
      });

      res.status(200).json({
        data: updatedBook,
      });
    } catch (error) {
      winston.error("BookController: Error updating book", {
        error: error.message,
        id: req.params.id,
        updateData: req.body,
      });

      if (error.message === "Book not found") {
        return res.status(404).json({
          error: {
            code: "BOOK_NOT_FOUND",
            message: "Book not found",
          },
        });
      }

      if (error.message.includes("ISBN")) {
        return res.status(400).json({
          error: {
            code: "INVALID_ISBN",
            message: error.message,
          },
        });
      }

      if (error.message.includes("quantity")) {
        return res.status(400).json({
          error: {
            code: "INVALID_QUANTITY",
            message: error.message,
          },
        });
      }

      // Handle duplicate ISBN constraint
      if (
        error.message.includes("duplicate") ||
        error.message.includes("unique")
      ) {
        return res.status(409).json({
          error: {
            code: "DUPLICATE_ISBN",
            message: "A book with this ISBN already exists",
          },
        });
      }

      next(error);
    }
  }

  /**
   * DELETE /api/books/:id - Delete a book
   */
  async deleteBook(req, res, next) {
    try {
      const { id } = req.params;

      winston.debug("BookController: Deleting book", { id });

      const deleted = await this.bookService.deleteBook(parseInt(id));

      if (!deleted) {
        winston.info("BookController: Book not found for deletion", { id });
        return res.status(404).json({
          error: {
            code: "BOOK_NOT_FOUND",
            message: "Book not found",
          },
        });
      }

      winston.info("BookController: Book deleted successfully", {
        bookId: id,
      });

      res.status(204).send();
    } catch (error) {
      winston.error("BookController: Error deleting book", {
        error: error.message,
        id: req.params.id,
      });

      if (error.message === "Book not found") {
        return res.status(404).json({
          error: {
            code: "BOOK_NOT_FOUND",
            message: "Book not found",
          },
        });
      }

      if (error.message.includes("active borrowings")) {
        return res.status(409).json({
          error: {
            code: "BOOK_HAS_ACTIVE_BORROWINGS",
            message: "Cannot delete book with active borrowings",
          },
        });
      }

      next(error);
    }
  }
}

module.exports = BookController;
