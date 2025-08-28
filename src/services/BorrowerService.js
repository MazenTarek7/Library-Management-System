const winston = require("winston");
const BorrowerRepository = require("../repositories/BorrowerRepository");
const BorrowingRepository = require("../repositories/BorrowingRepository");

/**
 * BorrowerService class for handling borrower business logic
 */
class BorrowerService {
  constructor(
    borrowerRepository = BorrowerRepository,
    borrowingRepository = BorrowingRepository
  ) {
    this.borrowerRepository = borrowerRepository;
    this.borrowingRepository = borrowingRepository;
  }

  /**
   * Register a new borrower
   * @param {Object} borrowerData - Borrower data to create
   * @param {string} borrowerData.name - Borrower name
   * @param {string} borrowerData.email - Borrower email
   * @returns {Promise<Object>} Created borrower
   * @throws {Error} If validation fails or creation fails
   */
  async registerBorrower(borrowerData) {
    try {
      logger.debug("BorrowerService: Registering new borrower", {
        borrowerData,
      });

      this._validateBorrowerData(borrowerData);

      const existingBorrower = await this.borrowerRepository.findByEmail(
        borrowerData.email
      );
      if (existingBorrower) {
        throw new Error("Email already exists");
      }

      const createdBorrower = await this.borrowerRepository.create(
        borrowerData
      );

      logger.info("BorrowerService: Borrower registered successfully", {
        borrowerId: createdBorrower.id,
        email: createdBorrower.email,
      });

      return createdBorrower;
    } catch (error) {
      logger.error("BorrowerService: Error registering borrower", {
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
   * @returns {Promise<Object>} Updated borrower
   * @throws {Error} If borrower not found or validation fails
   */
  async updateBorrower(id, updateData) {
    try {
      logger.debug("BorrowerService: Updating borrower", { id, updateData });

      const existingBorrower = await this.borrowerRepository.findById(id);
      if (!existingBorrower) {
        throw new Error("Borrower not found");
      }

      this._validateBorrowerData(updateData, false);

      // Check email uniqueness if email is being updated
      if (updateData.email && updateData.email !== existingBorrower.email) {
        const emailExists = await this.borrowerRepository.emailExists(
          updateData.email,
          id
        );
        if (emailExists) {
          throw new Error("Email already exists");
        }
      }

      const updatedBorrower = await this.borrowerRepository.update(
        id,
        updateData
      );

      logger.info("BorrowerService: Borrower updated successfully", {
        borrowerId: id,
        updatedFields: Object.keys(updateData),
      });

      return updatedBorrower;
    } catch (error) {
      logger.error("BorrowerService: Error updating borrower", {
        error: error.message,
        id,
        updateData,
      });
      throw error;
    }
  }

  /**
   * Delete a borrower
   * Business rule: Cannot delete if there are active borrowings
   * @param {number} id - Borrower ID
   * @returns {Promise<boolean>} True if deleted successfully
   * @throws {Error} If borrower has active borrowings or deletion fails
   */
  async deleteBorrower(id) {
    try {
      logger.debug("BorrowerService: Deleting borrower", { id });

      const existingBorrower = await this.borrowerRepository.findById(id);
      if (!existingBorrower) {
        throw new Error("Borrower not found");
      }

      // Check for active borrowings
      const activeBorrowings = await this.borrowingRepository.findByBorrower(
        id,
        {
          activeOnly: true,
        }
      );

      if (activeBorrowings.length > 0) {
        throw new Error("Cannot delete borrower with active borrowings");
      }

      const deleted = await this.borrowerRepository.delete(id);

      if (deleted) {
        logger.info("BorrowerService: Borrower deleted successfully", {
          borrowerId: id,
        });
      }

      return deleted;
    } catch (error) {
      logger.error("BorrowerService: Error deleting borrower", {
        error: error.message,
        id,
      });
      throw error;
    }
  }

  /**
   * Get all borrowers with pagination
   * @param {Object} options - Query options
   * @param {number} [options.limit] - Maximum number of results
   * @param {number} [options.offset] - Number of results to skip
   * @returns {Promise<Array>} Array of borrowers
   */
  async getAllBorrowers(options = {}) {
    try {
      logger.debug("BorrowerService: Getting all borrowers", { options });

      const borrowers = await this.borrowerRepository.findAll(options);

      logger.debug("BorrowerService: Retrieved borrowers", {
        count: borrowers.length,
      });

      return borrowers;
    } catch (error) {
      logger.error("BorrowerService: Error getting all borrowers", {
        error: error.message,
        options,
      });
      throw error;
    }
  }

  /**
   * Get a borrower by ID
   * @param {number} id - Borrower ID
   * @returns {Promise<Object|null>} Borrower or null if not found
   */
  async getBorrowerById(id) {
    try {
      logger.debug("BorrowerService: Getting borrower by ID", { id });

      const borrower = await this.borrowerRepository.findById(id);

      if (borrower) {
        logger.debug("BorrowerService: Borrower found", { borrowerId: id });
      } else {
        logger.debug("BorrowerService: Borrower not found", { id });
      }

      return borrower;
    } catch (error) {
      logger.error("BorrowerService: Error getting borrower by ID", {
        error: error.message,
        id,
      });
      throw error;
    }
  }

  /**
   * Get a borrower by email
   * @param {string} email - Email address
   * @returns {Promise<Object|null>} Borrower or null if not found
   */
  async getBorrowerByEmail(email) {
    try {
      logger.debug("BorrowerService: Getting borrower by email", { email });

      // Validate email format
      if (!this._isValidEmail(email)) {
        throw new Error("Invalid email format");
      }

      const borrower = await this.borrowerRepository.findByEmail(email);

      if (borrower) {
        logger.debug("BorrowerService: Borrower found by email", {
          borrowerId: borrower.id,
        });
      } else {
        logger.debug("BorrowerService: Borrower not found by email", {
          email,
        });
      }

      return borrower;
    } catch (error) {
      logger.error("BorrowerService: Error getting borrower by email", {
        error: error.message,
        email,
      });
      throw error;
    }
  }

  /**
   * Check if a borrower exists
   * @param {number} id - Borrower ID
   * @returns {Promise<boolean>} True if borrower exists
   */
  async borrowerExists(id) {
    try {
      logger.debug("BorrowerService: Checking if borrower exists", { id });

      const borrower = await this.borrowerRepository.findById(id);
      const exists = !!borrower;

      logger.debug("BorrowerService: Borrower existence check", {
        id,
        exists,
      });

      return exists;
    } catch (error) {
      logger.error("BorrowerService: Error checking borrower existence", {
        error: error.message,
        id,
      });
      throw error;
    }
  }

  /**
   * Check if an email is already registered
   * @param {string} email - Email address
   * @param {number} [excludeId] - ID to exclude from check (for updates)
   * @returns {Promise<boolean>} True if email exists
   */
  async emailExists(email, excludeId = null) {
    try {
      logger.debug("BorrowerService: Checking if email exists", {
        email,
        excludeId,
      });

      // Validate email format
      if (!this._isValidEmail(email)) {
        throw new Error("Invalid email format");
      }

      const exists = await this.borrowerRepository.emailExists(
        email,
        excludeId
      );

      logger.debug("BorrowerService: Email existence check", {
        email,
        excludeId,
        exists,
      });

      return exists;
    } catch (error) {
      logger.error("BorrowerService: Error checking email existence", {
        error: error.message,
        email,
        excludeId,
      });
      throw error;
    }
  }

  /**
   * Get borrower's current active borrowings
   * @param {number} borrowerId - Borrower ID
   * @returns {Promise<Array>} Array of active borrowings
   */
  async getBorrowerActiveBorrowings(borrowerId) {
    try {
      logger.debug("BorrowerService: Getting borrower active borrowings", {
        borrowerId,
      });

      // Check if borrower exists
      const borrower = await this.borrowerRepository.findById(borrowerId);
      if (!borrower) {
        throw new Error("Borrower not found");
      }

      const activeBorrowings = await this.borrowingRepository.findByBorrower(
        borrowerId,
        {
          activeOnly: true,
        }
      );

      logger.debug("BorrowerService: Retrieved active borrowings", {
        borrowerId,
        count: activeBorrowings.length,
      });

      return activeBorrowings;
    } catch (error) {
      logger.error(
        "BorrowerService: Error getting borrower active borrowings",
        {
          error: error.message,
          borrowerId,
        }
      );
      throw error;
    }
  }

  /**
   * Validate borrower data
   * @private
   * @param {Object} borrowerData - Borrower data to validate
   * @param {boolean} [requireAll=true] - Whether all fields are required
   * @throws {Error} If validation fails
   */
  _validateBorrowerData(borrowerData, requireAll = true) {
    if (requireAll) {
      if (!borrowerData.name || typeof borrowerData.name !== "string") {
        throw new Error("Name is required and must be a string");
      }
      if (!borrowerData.email || typeof borrowerData.email !== "string") {
        throw new Error("Email is required and must be a string");
      }
    } else {
      // Partial validation for updates
      if (
        borrowerData.name !== undefined &&
        (!borrowerData.name || typeof borrowerData.name !== "string")
      ) {
        throw new Error("Name must be a non-empty string");
      }
      if (
        borrowerData.email !== undefined &&
        (!borrowerData.email || typeof borrowerData.email !== "string")
      ) {
        throw new Error("Email must be a non-empty string");
      }
    }

    // Validate email format if provided
    if (borrowerData.email && !this._isValidEmail(borrowerData.email)) {
      throw new Error("Invalid email format");
    }

    // Validate name length and format
    if (borrowerData.name) {
      if (borrowerData.name.trim().length < 2) {
        throw new Error("Name must be at least 2 characters long");
      }
      if (borrowerData.name.trim().length > 255) {
        throw new Error("Name must be less than 255 characters");
      }
    }
  }

  /**
   * Validate email format
   * @private
   * @param {string} email - Email to validate
   * @returns {boolean} True if valid email format
   */
  _isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

module.exports = BorrowerService;
