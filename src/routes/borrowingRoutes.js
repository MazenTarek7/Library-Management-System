const express = require("express");
const BorrowingController = require("../controllers/BorrowingController");
const ValidationMiddleware = require("../middleware/validationMiddleware");
const {
  borrowingSchemas,
  borrowerSchemas,
  querySchemas,
} = require("../models/validation");

const router = express.Router();
const borrowingController = new BorrowingController();

/**
 * POST /api/borrowings/checkout - Check out a book to a borrower
 */
router.post(
  "/checkout",
  ValidationMiddleware.validateContentType("application/json"),
  ValidationMiddleware.validateBody(borrowingSchemas.checkout),
  (req, res, next) => borrowingController.checkoutBook(req, res, next)
);

/**
 * PUT /api/borrowings/:id/return - Return a book
 */
router.put(
  "/:id/return",
  ValidationMiddleware.validateParams(borrowingSchemas.returnBook),
  (req, res, next) => borrowingController.returnBook(req, res, next)
);

/**
 * GET /api/borrowings/overdue - Get all overdue books
 * Query parameters: limit, offset
 */
router.get(
  "/overdue",
  ValidationMiddleware.validateQuery(querySchemas.pagination),
  (req, res, next) => borrowingController.getOverdueBooks(req, res, next)
);

/**
 * GET /api/borrowings/exports/last-month - Export all borrowings of last month as CSV
 */
router.get("/exports/last-month", (req, res, next) =>
  borrowingController.exportBorrowingsLastMonthCSV(req, res, next)
);

/**
 * GET /api/borrowings/exports/overdue-last-month - Export overdue borrowings of last month as CSV
 */
router.get("/exports/overdue-last-month", (req, res, next) =>
  borrowingController.exportOverdueLastMonthCSV(req, res, next)
);

module.exports = router;
