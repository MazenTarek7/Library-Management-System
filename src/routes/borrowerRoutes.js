const express = require("express");
const BorrowerController = require("../controllers/BorrowerController");
const BorrowingController = require("../controllers/BorrowingController");
const ValidationMiddleware = require("../middleware/validationMiddleware");
const { borrowerSchemas, querySchemas } = require("../models/validation");

const router = express.Router();
const borrowerController = new BorrowerController();
const borrowingController = new BorrowingController();

/**
 * GET /api/borrowers - Get all borrowers with pagination
 * Query parameters: limit, offset
 */
router.get(
  "/",
  ValidationMiddleware.validateQuery(querySchemas.pagination),
  (req, res, next) => borrowerController.getAllBorrowers(req, res, next)
);

/**
 * GET /api/borrowers/:id - Get a specific borrower by ID
 */
router.get(
  "/:id",
  ValidationMiddleware.validateParams(borrowerSchemas.borrowerId),
  (req, res, next) => borrowerController.getBorrowerById(req, res, next)
);

/**
 * POST /api/borrowers - Register a new borrower
 */
router.post(
  "/",
  ValidationMiddleware.validateContentType("application/json"),
  ValidationMiddleware.validateBody(borrowerSchemas.createBorrower),
  (req, res, next) => borrowerController.createBorrower(req, res, next)
);

/**
 * PUT /api/borrowers/:id - Update an existing borrower
 */
router.put(
  "/:id",
  ValidationMiddleware.validateContentType("application/json"),
  ValidationMiddleware.validate({
    params: borrowerSchemas.borrowerId,
    body: borrowerSchemas.updateBorrower,
  }),
  (req, res, next) => borrowerController.updateBorrower(req, res, next)
);

/**
 * DELETE /api/borrowers/:id - Delete a borrower
 */
router.delete(
  "/:id",
  ValidationMiddleware.validateParams(borrowerSchemas.borrowerId),
  (req, res, next) => borrowerController.deleteBorrower(req, res, next)
);

/**
 * GET /api/borrowers/:id/current-books - Get borrower's current books (active borrowings)
 */
router.get(
  "/:id/current-books",
  ValidationMiddleware.validateParams(borrowerSchemas.borrowerId),
  (req, res, next) =>
    borrowingController.getBorrowerCurrentBooks(req, res, next)
);

module.exports = router;
