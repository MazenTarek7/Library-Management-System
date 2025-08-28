const prisma = require("../config/prisma");
const logger = require("../config/logger");
const Borrowing = require("../models/Borrowing");

/**
 * BorrowingRepository class for handling borrowing transaction operations using Prisma
 */
class BorrowingRepository {
  /**
   * Create a new borrowing (checkout a book)
   * @param {Object} borrowingData - Borrowing data to create
   * @param {number} borrowingData.borrowerId - Borrower ID
   * @param {number} borrowingData.bookId - Book ID
   * @returns {Promise<Object>} Created borrowing
   */
  static async create(borrowingData) {
    try {
      logger.debug("Creating new borrowing", { borrowingData });

      const checkoutDate = new Date();
      const dueDate = Borrowing.calculateDueDate(checkoutDate);

      const createdBorrowing = await prisma.borrowing.create({
        data: {
          borrowerId: borrowingData.borrowerId,
          bookId: borrowingData.bookId,
          checkoutDate: checkoutDate,
          dueDate: dueDate,
        },
        include: {
          book: true,
          borrower: true,
        },
      });

      logger.info("Borrowing created successfully", {
        borrowingId: createdBorrowing.id,
      });
      return Borrowing.fromDatabaseRow(createdBorrowing);
    } catch (error) {
      logger.error("Error creating borrowing", {
        error: error.message,
        borrowingData,
      });
      throw error;
    }
  }

  /**
   * Update an existing borrowing (mainly for returning books)
   * @param {number} id - Borrowing ID
   * @param {Object} updateData - Data to update
   * @param {Date} [updateData.returnDate] - Return date
   * @returns {Promise<Object|null>} Updated borrowing or null if not found
   */
  static async update(id, updateData) {
    try {
      logger.debug("Updating borrowing", { id, updateData });

      const updateFields = {};

      if (updateData.returnDate !== undefined) {
        updateFields.returnDate = updateData.returnDate;
      }

      const updatedBorrowing = await prisma.borrowing.update({
        where: { id },
        data: updateFields,
        include: {
          book: true,
          borrower: true,
        },
      });

      logger.info("Borrowing updated successfully", { borrowingId: id });
      return Borrowing.fromDatabaseRow(updatedBorrowing);
    } catch (error) {
      if (error.code === "P2025") {
        logger.warn("Borrowing not found for update", { id });
        return null;
      }
      logger.error("Error updating borrowing", {
        error: error.message,
        id,
        updateData,
      });
      throw error;
    }
  }

  /**
   * Find borrowings by borrower ID
   * @param {number} borrowerId - Borrower ID
   * @param {Object} options - Query options
   * @param {boolean} [options.activeOnly] - Only return active borrowings (not returned)
   * @param {number} [options.limit] - Maximum number of results
   * @param {number} [options.offset] - Number of results to skip
   * @returns {Promise<Array>} Array of borrowings
   */
  static async findByBorrower(borrowerId, options = {}) {
    try {
      logger.debug("Finding borrowings by borrower", { borrowerId, options });

      const where = { borrowerId };

      if (options.activeOnly) {
        where.returnDate = null;
      }

      const queryOptions = {
        where,
        include: {
          book: true,
          borrower: true,
        },
        orderBy: {
          checkoutDate: "desc",
        },
      };

      if (options.limit) {
        queryOptions.take = options.limit;
      }

      if (options.offset) {
        queryOptions.skip = options.offset;
      }

      const borrowings = await prisma.borrowing.findMany(queryOptions);

      logger.debug("Borrowings retrieved by borrower", {
        borrowerId,
        count: borrowings.length,
      });

      return borrowings.map((borrowing) =>
        Borrowing.fromDatabaseRow(borrowing)
      );
    } catch (error) {
      logger.error("Error finding borrowings by borrower", {
        error: error.message,
        borrowerId,
        options,
      });
      throw error;
    }
  }

  /**
   * Find borrowings by book
   * @param {number} bookId - Book ID
   * @param {Object} options - Query options
   * @param {boolean} [options.activeOnly] - Only return active borrowings (not returned)
   * @param {number} [options.limit] - Maximum number of results
   * @param {number} [options.offset] - Number of results to skip
   * @returns {Promise<Array>} Array of borrowings
   */
  static async findByBook(bookId, options = {}) {
    try {
      logger.debug("Finding borrowings by book", { bookId, options });

      const where = { bookId };

      if (options.activeOnly) {
        where.returnDate = null;
      }

      const queryOptions = {
        where,
        include: {
          book: true,
          borrower: true,
        },
        orderBy: {
          checkoutDate: "desc",
        },
      };

      if (options.limit) {
        queryOptions.take = options.limit;
      }

      if (options.offset) {
        queryOptions.skip = options.offset;
      }

      const borrowings = await prisma.borrowing.findMany(queryOptions);

      logger.debug("Borrowings retrieved by book", {
        bookId,
        count: borrowings.length,
      });

      return borrowings.map((borrowing) =>
        Borrowing.fromDatabaseRow(borrowing)
      );
    } catch (error) {
      logger.error("Error finding borrowings by book", {
        error: error.message,
        bookId,
        options,
      });
      throw error;
    }
  }

  /**
   * Find overdue borrowings
   * @param {Object} options - Query options
   * @param {Date} [options.asOfDate] - Date to check overdue status (defaults to now)
   * @param {number} [options.limit] - Maximum number of results
   * @param {number} [options.offset] - Number of results to skip
   * @returns {Promise<Array>} Array of overdue borrowings
   */
  static async findOverdue(options = {}) {
    try {
      logger.debug("Finding overdue borrowings", { options });

      const asOfDate = options.asOfDate || new Date();

      const queryOptions = {
        where: {
          returnDate: null,
          dueDate: {
            lt: asOfDate,
          },
        },
        include: {
          book: true,
          borrower: true,
        },
        orderBy: {
          dueDate: "asc",
        },
      };

      if (options.limit) {
        queryOptions.take = options.limit;
      }

      if (options.offset) {
        queryOptions.skip = options.offset;
      }

      const borrowings = await prisma.borrowing.findMany(queryOptions);

      logger.debug("Overdue borrowings retrieved", {
        count: borrowings.length,
        asOfDate: asOfDate.toISOString(),
      });

      return borrowings.map((borrowing) => {
        const borrowingObj = Borrowing.fromDatabaseRow(borrowing);
        // Add days overdue calculation
        borrowingObj.daysOverdue = Borrowing.getDaysOverdue(
          borrowingObj,
          asOfDate
        );
        return borrowingObj;
      });
    } catch (error) {
      logger.error("Error finding overdue borrowings", {
        error: error.message,
        options,
      });
      throw error;
    }
  }

  /**
   * Find a borrowing by ID
   * @param {number} id - Borrowing ID
   * @returns {Promise<Object|null>} Borrowing or null if not found
   */
  static async findById(id) {
    try {
      logger.debug("Finding borrowing by ID", { id });

      const borrowing = await prisma.borrowing.findUnique({
        where: { id },
        include: {
          book: true,
          borrower: true,
        },
      });

      if (borrowing) {
        logger.debug("Borrowing found", { borrowingId: id });
        return Borrowing.fromDatabaseRow(borrowing);
      } else {
        logger.debug("Borrowing not found", { id });
        return null;
      }
    } catch (error) {
      logger.error("Error finding borrowing by ID", {
        error: error.message,
        id,
      });
      throw error;
    }
  }

  /**
   * Find active borrowing for a specific book
   * @param {number} bookId - Book ID
   * @returns {Promise<Object|null>} Active borrowing or null if not found
   */
  static async findActiveByBook(bookId) {
    try {
      logger.debug("Finding active borrowing by book", { bookId });

      const borrowing = await prisma.borrowing.findFirst({
        where: {
          bookId,
          returnDate: null,
        },
        include: {
          book: true,
          borrower: true,
        },
        orderBy: {
          checkoutDate: "desc",
        },
      });

      if (borrowing) {
        logger.debug("Active borrowing found for book", {
          bookId,
          borrowingId: borrowing.id,
        });
        return Borrowing.fromDatabaseRow(borrowing);
      } else {
        logger.debug("No active borrowing found for book", { bookId });
        return null;
      }
    } catch (error) {
      logger.error("Error finding active borrowing by book", {
        error: error.message,
        bookId,
      });
      throw error;
    }
  }

  /**
   * Return a book (mark borrowing as returned)
   * @param {number} borrowingId - Borrowing ID
   * @param {Date} [returnDate] - Return date (defaults to now)
   * @returns {Promise<Object|null>} Updated borrowing or null if not found
   */
  static async returnBook(borrowingId, returnDate = new Date()) {
    try {
      logger.debug("Returning book", { borrowingId, returnDate });

      const updatedBorrowing = await prisma.borrowing.update({
        where: {
          id: borrowingId,
          returnDate: null, // Only update if not already returned
        },
        data: {
          returnDate: returnDate,
        },
        include: {
          book: true,
          borrower: true,
        },
      });

      logger.info("Book returned successfully", {
        borrowingId,
        returnDate: returnDate.toISOString(),
      });

      return Borrowing.fromDatabaseRow(updatedBorrowing);
    } catch (error) {
      if (error.code === "P2025") {
        logger.warn("Borrowing not found or already returned", {
          borrowingId,
        });
        return null;
      }
      logger.error("Error returning book", {
        error: error.message,
        borrowingId,
        returnDate,
      });
      throw error;
    }
  }

  /**
   * Get borrowing statistics
   * @returns {Promise<Object>} Statistics object
   */
  static async getStatistics() {
    try {
      logger.debug("Getting borrowing statistics");

      const [
        totalBorrowings,
        activeBorrowings,
        overdueBorrowings,
        returnedBorrowings,
      ] = await Promise.all([
        prisma.borrowing.count(),
        prisma.borrowing.count({
          where: { returnDate: null },
        }),
        prisma.borrowing.count({
          where: {
            returnDate: null,
            dueDate: { lt: new Date() },
          },
        }),
        prisma.borrowing.count({
          where: { returnDate: { not: null } },
        }),
      ]);

      const statistics = {
        total: totalBorrowings,
        active: activeBorrowings,
        overdue: overdueBorrowings,
        returned: returnedBorrowings,
      };

      logger.debug("Borrowing statistics retrieved", statistics);
      return statistics;
    } catch (error) {
      logger.error("Error getting borrowing statistics", {
        error: error.message,
      });
      throw error;
    }
  }
}

module.exports = BorrowingRepository;
