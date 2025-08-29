const prisma = require("../config/prisma");
const logger = require("../config/logger");
const Borrower = require("../models/Borrower");

/**
 * BorrowerRepository class for handling borrower data operations
 */
class BorrowerRepository {
  /**
   * Create a new borrower
   * @param {Object} borrowerData - Borrower data to create
   * @param {string} borrowerData.name - Borrower name
   * @param {string} borrowerData.email - Borrower email
   * @returns {Promise<Object>} Created borrower
   */
  static async create(borrowerData) {
    try {
      logger.debug("Creating new borrower", { borrowerData });

      const normalizedEmail = Borrower.normalizeEmail(borrowerData.email);

      if (!Borrower.isValidEmail(normalizedEmail)) {
        throw new Error("Invalid email format");
      }

      const createdBorrower = await prisma.borrower.create({
        data: {
          name: borrowerData.name,
          email: normalizedEmail,
        },
      });

      logger.info("Borrower created successfully", {
        borrowerId: createdBorrower.id,
      });
      return Borrower.fromDatabaseRow(createdBorrower);
    } catch (error) {
      if (error.code === "P2002" && error.meta?.target?.includes("email")) {
        logger.warn("Email already exists", { email: borrowerData.email });
        const customError = new Error(
          "A borrower with this email already exists"
        );
        customError.code = "DUPLICATE_EMAIL";
        customError.statusCode = 400;
        customError.isOperational = true;
        throw customError;
      }
      logger.error("Error creating borrower", {
        error: error.message,
        borrowerData,
      });
      throw error;
    }
  }

  /**
   * Update an existing borrower
   * @param {number} id - Borrower ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object|null>} Updated borrower or null if not found
   */
  static async update(id, updateData) {
    try {
      logger.debug("Updating borrower", { id, updateData });

      const updateFields = {};

      if (updateData.name !== undefined) updateFields.name = updateData.name;
      if (updateData.email !== undefined) {
        const normalizedEmail = Borrower.normalizeEmail(updateData.email);
        if (!Borrower.isValidEmail(normalizedEmail)) {
          throw new Error("Invalid email format");
        }
        updateFields.email = normalizedEmail;
      }

      const updatedBorrower = await prisma.borrower.update({
        where: { id },
        data: updateFields,
      });

      logger.info("Borrower updated successfully", { borrowerId: id });
      return Borrower.fromDatabaseRow(updatedBorrower);
    } catch (error) {
      if (error.code === "P2025") {
        logger.warn("Borrower not found for update", { id });
        return null;
      }
      if (error.code === "P2002" && error.meta?.target?.includes("email")) {
        logger.warn("Email already exists", { email: updateData.email });
        const customError = new Error(
          "A borrower with this email already exists"
        );
        customError.code = "DUPLICATE_EMAIL";
        customError.statusCode = 400;
        customError.isOperational = true;
        throw customError;
      }
      logger.error("Error updating borrower", {
        error: error.message,
        id,
        updateData,
      });
      throw error;
    }
  }

  /**
   * Delete a borrower
   * @param {number} id - Borrower ID
   * @returns {Promise<boolean>} True if deleted, false if not found
   */
  static async delete(id) {
    try {
      logger.debug("Deleting borrower", { id });

      await prisma.borrower.delete({
        where: { id },
      });

      logger.info("Borrower deleted successfully", { borrowerId: id });
      return true;
    } catch (error) {
      if (error.code === "P2025") {
        logger.warn("Borrower not found for deletion", { id });
        return false;
      }
      logger.error("Error deleting borrower", { error: error.message, id });
      throw error;
    }
  }

  /**
   * Find a borrower by ID
   * @param {number} id - Borrower ID
   * @returns {Promise<Object|null>} Borrower or null if not found
   */
  static async findById(id) {
    try {
      logger.debug("Finding borrower by ID", { id });

      const borrower = await prisma.borrower.findUnique({
        where: { id },
      });

      if (borrower) {
        logger.debug("Borrower found", { borrowerId: id });
        return Borrower.fromDatabaseRow(borrower);
      } else {
        logger.debug("Borrower not found", { id });
        return null;
      }
    } catch (error) {
      logger.error("Error finding borrower by ID", {
        error: error.message,
        id,
      });
      throw error;
    }
  }

  /**
   * Find all borrowers with optional pagination
   * @param {Object} options - Query options
   * @param {number} [options.limit] - Maximum number of results
   * @param {number} [options.offset] - Number of results to skip
   * @returns {Promise<Array>} Array of borrowers
   */
  static async findAll(options = {}) {
    try {
      logger.debug("Finding all borrowers", { options });

      const queryOptions = {};

      if (options.limit) {
        queryOptions.take = options.limit;
      }

      if (options.offset) {
        queryOptions.skip = options.offset;
      }

      const borrowers = await prisma.borrower.findMany(queryOptions);

      logger.debug("Borrowers retrieved", { count: borrowers.length });
      return borrowers.map((borrower) => Borrower.fromDatabaseRow(borrower));
    } catch (error) {
      logger.error("Error finding all borrowers", {
        error: error.message,
        options,
      });
      throw error;
    }
  }

  /**
   * Find a borrower by email
   * @param {string} email - Email address
   * @returns {Promise<Object|null>} Borrower or null if not found
   */
  static async findByEmail(email) {
    try {
      logger.debug("Finding borrower by email", { email });

      const normalizedEmail = Borrower.normalizeEmail(email);

      const borrower = await prisma.borrower.findUnique({
        where: { email: normalizedEmail },
      });

      if (borrower) {
        logger.debug("Borrower found by email", { borrowerId: borrower.id });
        return Borrower.fromDatabaseRow(borrower);
      } else {
        logger.debug("Borrower not found by email", {
          email: normalizedEmail,
        });
        return null;
      }
    } catch (error) {
      logger.error("Error finding borrower by email", {
        error: error.message,
        email,
      });
      throw error;
    }
  }

  /**
   * Check if email exists (for validation)
   * @param {string} email - Email address to check
   * @param {number} [excludeId] - ID to exclude from check (for updates)
   * @returns {Promise<boolean>} True if email exists
   */
  static async emailExists(email, excludeId = null) {
    try {
      logger.debug("Checking if email exists", { email, excludeId });

      const normalizedEmail = Borrower.normalizeEmail(email);

      const where = { email: normalizedEmail };
      if (excludeId) {
        where.id = { not: excludeId };
      }

      const borrower = await prisma.borrower.findFirst({ where });

      const exists = !!borrower;
      logger.debug("Email existence check result", {
        email: normalizedEmail,
        exists,
      });

      return exists;
    } catch (error) {
      logger.error("Error checking email existence", {
        error: error.message,
        email,
      });
      throw error;
    }
  }
}

module.exports = BorrowerRepository;
