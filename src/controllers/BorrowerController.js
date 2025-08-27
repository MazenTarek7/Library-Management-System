const winston = require("winston");
const BorrowerService = require("../services/BorrowerService");

class BorrowerController {
  constructor(borrowerService = new BorrowerService()) {
    this.borrowerService = borrowerService;
  }

  /**
   * GET /api/borrowers - Get all borrowers with pagination
   */
  async getAllBorrowers(req, res, next) {
    try {
      winston.debug("BorrowerController: Getting all borrowers", {
        query: req.query,
      });

      const { limit, offset } = req.query;

      const borrowers = await this.borrowerService.getAllBorrowers({
        limit,
        offset,
      });

      winston.info("BorrowerController: Borrowers retrieved successfully", {
        count: borrowers.length,
      });

      res.status(200).json({
        data: borrowers,
        meta: {
          total: borrowers.length,
          limit: limit || 10,
          offset: offset || 0,
          hasNext: borrowers.length === (limit || 10),
          hasPrevious: (offset || 0) > 0,
        },
      });
    } catch (error) {
      winston.error("BorrowerController: Error getting all borrowers", {
        error: error.message,
        query: req.query,
      });
      next(error);
    }
  }

  /**
   * GET /api/borrowers/:id - Get a specific borrower by ID
   */
  async getBorrowerById(req, res, next) {
    try {
      const { id } = req.params;

      winston.debug("BorrowerController: Getting borrower by ID", { id });

      const borrower = await this.borrowerService.getBorrowerById(parseInt(id));

      if (!borrower) {
        winston.info("BorrowerController: Borrower not found", { id });
        return res.status(404).json({
          error: {
            code: "BORROWER_NOT_FOUND",
            message: "Borrower not found",
          },
        });
      }

      winston.info("BorrowerController: Borrower retrieved successfully", {
        borrowerId: id,
        name: borrower.name,
      });

      res.status(200).json({
        data: borrower,
      });
    } catch (error) {
      winston.error("BorrowerController: Error getting borrower by ID", {
        error: error.message,
        id: req.params.id,
      });
      next(error);
    }
  }

  /**
   * POST /api/borrowers - Register a new borrower
   */
  async createBorrower(req, res, next) {
    try {
      winston.debug("BorrowerController: Creating new borrower", {
        borrowerData: req.body,
      });

      const createdBorrower = await this.borrowerService.registerBorrower(
        req.body
      );

      winston.info("BorrowerController: Borrower created successfully", {
        borrowerId: createdBorrower.id,
        email: createdBorrower.email,
      });

      res.status(201).json({
        data: createdBorrower,
      });
    } catch (error) {
      winston.error("BorrowerController: Error creating borrower", {
        error: error.message,
        borrowerData: req.body,
      });

      if (error.message.includes("Email already exists")) {
        return res.status(409).json({
          error: {
            code: "DUPLICATE_EMAIL",
            message: "A borrower with this email already exists",
          },
        });
      }

      if (error.message.includes("Invalid email format")) {
        return res.status(400).json({
          error: {
            code: "INVALID_EMAIL",
            message: error.message,
          },
        });
      }

      if (error.message.includes("Name") || error.message.includes("Email")) {
        return res.status(400).json({
          error: {
            code: "VALIDATION_ERROR",
            message: error.message,
          },
        });
      }

      next(error);
    }
  }

  /**
   * PUT /api/borrowers/:id - Update an existing borrower
   */
  async updateBorrower(req, res, next) {
    try {
      const { id } = req.params;

      winston.debug("BorrowerController: Updating borrower", {
        id,
        updateData: req.body,
      });

      const updatedBorrower = await this.borrowerService.updateBorrower(
        parseInt(id),
        req.body
      );

      winston.info("BorrowerController: Borrower updated successfully", {
        borrowerId: id,
        updatedFields: Object.keys(req.body),
      });

      res.status(200).json({
        data: updatedBorrower,
      });
    } catch (error) {
      winston.error("BorrowerController: Error updating borrower", {
        error: error.message,
        id: req.params.id,
        updateData: req.body,
      });

      if (error.message === "Borrower not found") {
        return res.status(404).json({
          error: {
            code: "BORROWER_NOT_FOUND",
            message: "Borrower not found",
          },
        });
      }

      if (error.message.includes("Email already exists")) {
        return res.status(409).json({
          error: {
            code: "DUPLICATE_EMAIL",
            message: "A borrower with this email already exists",
          },
        });
      }

      if (error.message.includes("Invalid email format")) {
        return res.status(400).json({
          error: {
            code: "INVALID_EMAIL",
            message: error.message,
          },
        });
      }

      if (error.message.includes("Name") || error.message.includes("Email")) {
        return res.status(400).json({
          error: {
            code: "VALIDATION_ERROR",
            message: error.message,
          },
        });
      }

      next(error);
    }
  }

  /**
   * DELETE /api/borrowers/:id - Delete a borrower
   */
  async deleteBorrower(req, res, next) {
    try {
      const { id } = req.params;

      winston.debug("BorrowerController: Deleting borrower", { id });

      const deleted = await this.borrowerService.deleteBorrower(parseInt(id));

      if (!deleted) {
        winston.info("BorrowerController: Borrower not found for deletion", {
          id,
        });
        return res.status(404).json({
          error: {
            code: "BORROWER_NOT_FOUND",
            message: "Borrower not found",
          },
        });
      }

      winston.info("BorrowerController: Borrower deleted successfully", {
        borrowerId: id,
      });

      res.status(204).send();
    } catch (error) {
      winston.error("BorrowerController: Error deleting borrower", {
        error: error.message,
        id: req.params.id,
      });

      // Handle specific business logic errors
      if (error.message === "Borrower not found") {
        return res.status(404).json({
          error: {
            code: "BORROWER_NOT_FOUND",
            message: "Borrower not found",
          },
        });
      }

      if (error.message.includes("active borrowings")) {
        return res.status(409).json({
          error: {
            code: "BORROWER_HAS_ACTIVE_BORROWINGS",
            message: "Cannot delete borrower with active borrowings",
          },
        });
      }

      next(error);
    }
  }
}

module.exports = BorrowerController;
