const logger = require("../config/logger");
const BorrowingService = require("../services/BorrowingService");

class BorrowingController {
  constructor(borrowingService = new BorrowingService()) {
    this.borrowingService = borrowingService;
  }

  /**
   * POST /api/borrowings/checkout - Check out a book to a borrower
   */
  async checkoutBook(req, res, next) {
    try {
      logger.debug("BorrowingController: Checking out book", {
        requestBody: req.body,
      });

      const { borrowerId, bookId } = req.body;

      const borrowing = await this.borrowingService.checkoutBook(
        borrowerId,
        bookId
      );

      logger.info("BorrowingController: Book checked out successfully", {
        borrowingId: borrowing.id,
        borrowerId,
        bookId,
        dueDate: borrowing.dueDate,
      });

      res.status(201).json({
        data: borrowing,
      });
    } catch (error) {
      logger.error("BorrowingController: Error checking out book", {
        error: error.message,
        requestBody: req.body,
      });

      if (error.message === "Borrower not found") {
        return res.status(404).json({
          error: {
            code: "BORROWER_NOT_FOUND",
            message: "Borrower not found",
          },
        });
      }

      if (error.message === "Book not found") {
        return res.status(404).json({
          error: {
            code: "BOOK_NOT_FOUND",
            message: "Book not found",
          },
        });
      }

      if (error.message === "Book is not available for checkout") {
        return res.status(409).json({
          error: {
            code: "BOOK_NOT_AVAILABLE",
            message: "Book is not available for checkout",
          },
        });
      }

      if (error.message.includes("required") || error.message.includes("ID")) {
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
   * PUT /api/borrowings/:id/return - Return a book
   */
  async returnBook(req, res, next) {
    try {
      const { id } = req.params;

      logger.debug("BorrowingController: Returning book", {
        borrowingId: id,
      });

      const borrowing = await this.borrowingService.returnBook(parseInt(id));

      logger.info("BorrowingController: Book returned successfully", {
        borrowingId: id,
        bookId: borrowing.bookId,
        borrowerId: borrowing.borrowerId,
        returnDate: borrowing.returnDate,
      });

      res.status(200).json({
        data: borrowing,
      });
    } catch (error) {
      logger.error("BorrowingController: Error returning book", {
        error: error.message,
        borrowingId: req.params.id,
      });

      // Handle specific business logic errors
      if (error.message === "Borrowing record not found") {
        return res.status(404).json({
          error: {
            code: "BORROWING_NOT_FOUND",
            message: "Borrowing record not found",
          },
        });
      }

      if (error.message === "Book has already been returned") {
        return res.status(409).json({
          error: {
            code: "BOOK_ALREADY_RETURNED",
            message: "Book has already been returned",
          },
        });
      }

      if (error.message.includes("required") || error.message.includes("ID")) {
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
   * GET /api/borrowers/:id/current-books - Get borrower's current books (active borrowings)
   */
  async getBorrowerCurrentBooks(req, res, next) {
    try {
      const { id } = req.params;

      logger.debug("BorrowingController: Getting borrower current books", {
        borrowerId: id,
      });

      const currentBooks = await this.borrowingService.getBorrowerCurrentBooks(
        parseInt(id)
      );

      logger.info(
        "BorrowingController: Borrower current books retrieved successfully",
        {
          borrowerId: id,
          count: currentBooks.length,
        }
      );

      res.status(200).json({
        data: currentBooks,
        meta: {
          total: currentBooks.length,
          borrowerId: parseInt(id),
        },
      });
    } catch (error) {
      logger.error(
        "BorrowingController: Error getting borrower current books",
        {
          error: error.message,
          borrowerId: req.params.id,
        }
      );

      // Handle specific business logic errors
      if (error.message === "Borrower not found") {
        return res.status(404).json({
          error: {
            code: "BORROWER_NOT_FOUND",
            message: "Borrower not found",
          },
        });
      }

      if (error.message.includes("required") || error.message.includes("ID")) {
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
   * GET /api/borrowings/overdue - Get all overdue books
   */
  async getOverdueBooks(req, res, next) {
    try {
      logger.debug("BorrowingController: Getting overdue books", {
        query: req.query,
      });

      const { limit, offset } = req.query;

      const overdueBooks = await this.borrowingService.getOverdueBooks({
        limit: limit ? parseInt(limit) : undefined,
        offset: offset ? parseInt(offset) : undefined,
      });

      logger.info("BorrowingController: Overdue books retrieved successfully", {
        count: overdueBooks.length,
      });

      res.status(200).json({
        data: overdueBooks,
        meta: {
          total: overdueBooks.length,
          limit: limit || 10,
          offset: offset || 0,
          hasNext: overdueBooks.length === (parseInt(limit) || 10),
          hasPrevious: (parseInt(offset) || 0) > 0,
        },
      });
    } catch (error) {
      logger.error("BorrowingController: Error getting overdue books", {
        error: error.message,
        query: req.query,
      });
      next(error);
    }
  }

  /**
   * GET /api/borrowings/exports/last-month.csv - All borrowings in last month as CSV
   */
  async exportBorrowingsLastMonthCSV(req, res, next) {
    try {
      logger.debug(
        "BorrowingController: Exporting all borrowings of last month to CSV"
      );

      const items = await this.borrowingService.getBorrowingsOfLastMonth();

      const rows = items.map((b) => ({
        id: b.id,
        borrowerId: b.borrowerId,
        borrowerName: b.borrower?.name,
        borrowerEmail: b.borrower?.email,
        bookId: b.bookId,
        bookTitle: b.book?.title,
        bookAuthor: b.book?.author,
        isbn: b.book?.isbn,
        checkoutDate: b.checkoutDate,
        dueDate: b.dueDate,
        returnDate: b.returnDate,
      }));

      const { toCSV } = require("../utils/csv");
      const csv = toCSV(rows, [
        "id",
        "borrowerId",
        "borrowerName",
        "borrowerEmail",
        "bookId",
        "bookTitle",
        "bookAuthor",
        "isbn",
        "checkoutDate",
        "dueDate",
        "returnDate",
      ]);

      const { start, end } = BorrowingService.getLastMonthRange();
      const filename = `borrowings_${start.toISOString().slice(0, 10)}_${end
        .toISOString()
        .slice(0, 10)}.csv`;

      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=\"${filename}\"`
      );
      res.status(200).send(csv);
    } catch (error) {
      logger.error(
        "BorrowingController: Error exporting last month's borrowings",
        { error: error.message }
      );
      next(error);
    }
  }

  /**
   * GET /api/borrowings/exports/overdue-last-month.csv - Overdue borrowings of last month as CSV
   */
  async exportOverdueLastMonthCSV(req, res, next) {
    try {
      logger.debug(
        "BorrowingController: Exporting overdue borrowings of last month to CSV"
      );

      const items =
        await this.borrowingService.getOverdueBorrowingsOfLastMonth();

      const rows = items.map((b) => ({
        id: b.id,
        borrowerId: b.borrowerId,
        borrowerName: b.borrower?.name,
        borrowerEmail: b.borrower?.email,
        bookId: b.bookId,
        bookTitle: b.book?.title,
        bookAuthor: b.book?.author,
        isbn: b.book?.isbn,
        checkoutDate: b.checkoutDate,
        dueDate: b.dueDate,
        daysOverdue: b.daysOverdue ?? undefined,
      }));

      const { toCSV } = require("../utils/csv");
      const csv = toCSV(rows, [
        "id",
        "borrowerId",
        "borrowerName",
        "borrowerEmail",
        "bookId",
        "bookTitle",
        "bookAuthor",
        "isbn",
        "checkoutDate",
        "dueDate",
        "daysOverdue",
      ]);

      const { start, end } = BorrowingService.getLastMonthRange();
      const filename = `overdue_${start.toISOString().slice(0, 10)}_${end
        .toISOString()
        .slice(0, 10)}.csv`;

      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=\"${filename}\"`
      );
      res.status(200).send(csv);
    } catch (error) {
      logger.error(
        "BorrowingController: Error exporting last month's overdue borrowings",
        { error: error.message }
      );
      next(error);
    }
  }
}

module.exports = BorrowingController;
