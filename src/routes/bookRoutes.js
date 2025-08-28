const express = require("express");
const BookController = require("../controllers/BookController");
const ValidationMiddleware = require("../middleware/validationMiddleware");
const { bookSchemas, querySchemas } = require("../models/validation");
const { bookRateLimiter } = require("../middleware/rateLimitMiddleware");
const { basicAuth } = require("../middleware/authMiddleware");

const router = express.Router();
const bookController = new BookController();

/**
 * GET /api/books - Get all books with pagination and search
 * Query parameters: limit, offset, search
 * Rate Limited: 100 requests per 15 minutes per IP
 * Authentication: Basic Auth required
 */
router.get(
  "/",
  bookRateLimiter,
  basicAuth,
  ValidationMiddleware.validateQuery(querySchemas.bookListing),
  (req, res, next) => bookController.getAllBooks(req, res, next)
);

/**
 * GET /api/books/:id - Get a specific book by ID
 * Rate Limited: 100 requests per 15 minutes per IP
 * Authentication: Basic Auth required
 */
router.get(
  "/:id",
  bookRateLimiter,
  basicAuth,
  ValidationMiddleware.validateParams(bookSchemas.bookId),
  (req, res, next) => bookController.getBookById(req, res, next)
);

/**
 * POST /api/books - Create a new book
 */
router.post(
  "/",
  ValidationMiddleware.validateContentType("application/json"),
  ValidationMiddleware.validateBody(bookSchemas.createBook),
  (req, res, next) => bookController.createBook(req, res, next)
);

/**
 * PUT /api/books/:id - Update an existing book
 */
router.put(
  "/:id",
  ValidationMiddleware.validateContentType("application/json"),
  ValidationMiddleware.validate({
    params: bookSchemas.bookId,
    body: bookSchemas.updateBook,
  }),
  (req, res, next) => bookController.updateBook(req, res, next)
);

/**
 * DELETE /api/books/:id - Delete a book
 */
router.delete(
  "/:id",
  ValidationMiddleware.validateParams(bookSchemas.bookId),
  (req, res, next) => bookController.deleteBook(req, res, next)
);

module.exports = router;
