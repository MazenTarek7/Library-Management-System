const ModelTransformers = require("../../src/models/transformers");
const { Book, Borrower, Borrowing } = require("../../src/models");

describe("Model Transformers", () => {
  describe("Generic Transformers", () => {
    describe("transformMany", () => {
      it("should transform array of rows using provided transformer", () => {
        const rows = [
          { id: 1, name: "Item 1" },
          { id: 2, name: "Item 2" },
        ];

        const transformer = (row) => ({ ...row, transformed: true });
        const result = ModelTransformers.transformMany(rows, transformer);

        expect(result).toHaveLength(2);
        expect(result[0]).toEqual({ id: 1, name: "Item 1", transformed: true });
        expect(result[1]).toEqual({ id: 2, name: "Item 2", transformed: true });
      });

      it("should filter out null results", () => {
        const rows = [
          { id: 1, name: "Item 1" },
          null,
          { id: 2, name: "Item 2" },
        ];

        const transformer = (row) =>
          row ? { ...row, transformed: true } : null;
        const result = ModelTransformers.transformMany(rows, transformer);

        expect(result).toHaveLength(2);
      });

      it("should return empty array for non-array input", () => {
        expect(ModelTransformers.transformMany(null, () => {})).toEqual([]);
        expect(ModelTransformers.transformMany("not array", () => {})).toEqual(
          []
        );
      });
    });

    describe("transformPaginated", () => {
      it("should transform paginated database result", () => {
        const dbResult = {
          rows: [
            { id: 1, name: "Item 1" },
            { id: 2, name: "Item 2" },
          ],
          count: "10",
        };

        const transformer = (row) => ({ ...row, transformed: true });
        const result = ModelTransformers.transformPaginated(
          dbResult,
          transformer,
          5,
          0
        );

        expect(result.data).toHaveLength(2);
        expect(result.data[0].transformed).toBe(true);
        expect(result.meta).toEqual({
          total: 10,
          limit: 5,
          offset: 0,
          hasNext: true,
          hasPrevious: false,
        });
      });

      it("should calculate pagination metadata correctly", () => {
        const dbResult = { rows: [], count: "25" };

        // Test middle page
        let result = ModelTransformers.transformPaginated(
          dbResult,
          () => {},
          10,
          10
        );
        expect(result.meta.hasNext).toBe(true);
        expect(result.meta.hasPrevious).toBe(true);

        // Test last page
        result = ModelTransformers.transformPaginated(
          dbResult,
          () => {},
          10,
          20
        );
        expect(result.meta.hasNext).toBe(false);
        expect(result.meta.hasPrevious).toBe(true);

        // Test first page
        result = ModelTransformers.transformPaginated(
          dbResult,
          () => {},
          10,
          0
        );
        expect(result.meta.hasNext).toBe(true);
        expect(result.meta.hasPrevious).toBe(false);
      });
    });
  });

  describe("Book Transformers", () => {
    const mockBookRow = {
      id: 1,
      title: "Test Book",
      author: "Test Author",
      isbn: "1234567890123",
      total_quantity: 5,
      available_quantity: 3,
      shelf_location: "A1-B2",
      created_at: "2023-01-01T00:00:00Z",
      updated_at: "2023-01-01T00:00:00Z",
    };

    describe("fromRow", () => {
      it("should transform single book row", () => {
        const result = ModelTransformers.book.fromRow(mockBookRow);

        expect(result).toEqual({
          id: 1,
          title: "Test Book",
          author: "Test Author",
          isbn: "1234567890123",
          totalQuantity: 5,
          availableQuantity: 3,
          shelfLocation: "A1-B2",
          createdAt: new Date("2023-01-01T00:00:00Z"),
          updatedAt: new Date("2023-01-01T00:00:00Z"),
        });
      });
    });

    describe("fromRows", () => {
      it("should transform multiple book rows", () => {
        const rows = [mockBookRow, { ...mockBookRow, id: 2, title: "Book 2" }];
        const result = ModelTransformers.book.fromRows(rows);

        expect(result).toHaveLength(2);
        expect(result[0].id).toBe(1);
        expect(result[1].id).toBe(2);
        expect(result[1].title).toBe("Book 2");
      });
    });

    describe("toRow", () => {
      it("should transform book data to database format", () => {
        const bookData = {
          title: "Test Book",
          author: "Test Author",
          isbn: "1234567890123",
          totalQuantity: 5,
          shelfLocation: "A1-B2",
        };

        const result = ModelTransformers.book.toRow(bookData);

        expect(result).toEqual({
          title: "Test Book",
          author: "Test Author",
          isbn: "1234567890123",
          total_quantity: 5,
          available_quantity: 5,
          shelf_location: "A1-B2",
        });
      });
    });

    describe("paginated", () => {
      it("should transform paginated book results", () => {
        const dbResult = {
          rows: [mockBookRow],
          count: "1",
        };

        const result = ModelTransformers.book.paginated(dbResult, 10, 0);

        expect(result.data).toHaveLength(1);
        expect(result.data[0].title).toBe("Test Book");
        expect(result.meta.total).toBe(1);
      });
    });

    describe("forResponse", () => {
      it("should add computed fields for API response", () => {
        const book = {
          id: 1,
          totalQuantity: 5,
          availableQuantity: 3,
        };

        const result = ModelTransformers.book.forResponse(book);

        expect(result.availabilityStatus).toBe("partially_available");
        expect(result.isAvailable).toBe(true);
      });

      it("should handle null book", () => {
        expect(ModelTransformers.book.forResponse(null)).toBeNull();
      });
    });
  });

  describe("Borrower Transformers", () => {
    const mockBorrowerRow = {
      id: 1,
      name: "John Doe",
      email: "john.doe@example.com",
      registered_date: "2023-01-01",
      created_at: "2023-01-01T00:00:00Z",
      updated_at: "2023-01-01T00:00:00Z",
    };

    describe("fromRow", () => {
      it("should transform single borrower row", () => {
        const result = ModelTransformers.borrower.fromRow(mockBorrowerRow);

        expect(result).toEqual({
          id: 1,
          name: "John Doe",
          email: "john.doe@example.com",
          registeredDate: new Date("2023-01-01"),
          createdAt: new Date("2023-01-01T00:00:00Z"),
          updatedAt: new Date("2023-01-01T00:00:00Z"),
        });
      });
    });

    describe("fromRows", () => {
      it("should transform multiple borrower rows", () => {
        const rows = [
          mockBorrowerRow,
          { ...mockBorrowerRow, id: 2, name: "Jane Doe" },
        ];
        const result = ModelTransformers.borrower.fromRows(rows);

        expect(result).toHaveLength(2);
        expect(result[0].name).toBe("John Doe");
        expect(result[1].name).toBe("Jane Doe");
      });
    });

    describe("toRow", () => {
      it("should transform borrower data to database format", () => {
        const borrowerData = {
          name: "John Doe",
          email: "John.Doe@Example.com",
        };

        const result = ModelTransformers.borrower.toRow(borrowerData);

        expect(result).toEqual({
          name: "John Doe",
          email: "john.doe@example.com",
        });
      });
    });

    describe("forResponse", () => {
      it("should return borrower data for API response", () => {
        const borrower = { id: 1, name: "John Doe", email: "john@example.com" };
        const result = ModelTransformers.borrower.forResponse(borrower);

        expect(result).toEqual(borrower);
      });

      it("should handle null borrower", () => {
        expect(ModelTransformers.borrower.forResponse(null)).toBeNull();
      });
    });
  });

  describe("Borrowing Transformers", () => {
    const mockBorrowingRow = {
      id: 1,
      borrower_id: 1,
      book_id: 1,
      checkout_date: "2023-01-01",
      due_date: "2023-01-15",
      return_date: null,
      created_at: "2023-01-01T00:00:00Z",
      updated_at: "2023-01-01T00:00:00Z",
    };

    describe("fromRow", () => {
      it("should transform single borrowing row", () => {
        const result = ModelTransformers.borrowing.fromRow(mockBorrowingRow);

        expect(result).toEqual({
          id: 1,
          borrowerId: 1,
          bookId: 1,
          checkoutDate: new Date("2023-01-01"),
          dueDate: new Date("2023-01-15"),
          returnDate: null,
          createdAt: new Date("2023-01-01T00:00:00Z"),
          updatedAt: new Date("2023-01-01T00:00:00Z"),
        });
      });
    });

    describe("forResponse", () => {
      it("should add computed fields for API response", () => {
        const borrowing = {
          id: 1,
          dueDate: new Date("2023-01-01"),
          returnDate: null,
        };
        const currentDate = new Date("2023-01-05");

        const result = ModelTransformers.borrowing.forResponse(
          borrowing,
          currentDate
        );

        expect(result.status).toBe("overdue");
        expect(result.isOverdue).toBe(true);
        expect(result.daysOverdue).toBe(4);
        expect(result.isActive).toBe(true);
      });

      it("should handle null borrowing", () => {
        expect(ModelTransformers.borrowing.forResponse(null)).toBeNull();
      });
    });

    describe("toOverdue", () => {
      it("should transform borrowing to overdue format when overdue", () => {
        const borrowing = {
          id: 1,
          borrowerId: 1,
          bookId: 1,
          checkoutDate: new Date("2023-01-01"),
          dueDate: new Date("2023-01-01"),
          returnDate: null,
          book: {
            id: 1,
            title: "Test Book",
            author: "Test Author",
            isbn: "1234567890123",
            shelfLocation: "A1-B2",
          },
          borrower: {
            id: 1,
            name: "John Doe",
            email: "john@example.com",
          },
        };
        const currentDate = new Date("2023-01-05");

        const result = ModelTransformers.borrowing.toOverdue(
          borrowing,
          currentDate
        );

        expect(result).toEqual({
          id: 1,
          borrowerId: 1,
          bookId: 1,
          checkoutDate: new Date("2023-01-01"),
          dueDate: new Date("2023-01-01"),
          daysOverdue: 4,
          book: {
            id: 1,
            title: "Test Book",
            author: "Test Author",
            isbn: "1234567890123",
            shelfLocation: "A1-B2",
          },
          borrower: {
            id: 1,
            name: "John Doe",
            email: "john@example.com",
          },
        });
      });

      it("should return null when borrowing is not overdue", () => {
        const borrowing = {
          dueDate: new Date("2023-01-15"),
          returnDate: null,
        };
        const currentDate = new Date("2023-01-01");

        const result = ModelTransformers.borrowing.toOverdue(
          borrowing,
          currentDate
        );
        expect(result).toBeNull();
      });

      it("should return null when borrowing is returned", () => {
        const borrowing = {
          dueDate: new Date("2023-01-01"),
          returnDate: new Date("2023-01-02"),
        };
        const currentDate = new Date("2023-01-05");

        const result = ModelTransformers.borrowing.toOverdue(
          borrowing,
          currentDate
        );
        expect(result).toBeNull();
      });
    });

    describe("toOverdueMany", () => {
      it("should transform multiple borrowings to overdue format", () => {
        const borrowings = [
          {
            id: 1,
            dueDate: new Date("2023-01-01"),
            returnDate: null,
            book: {
              id: 1,
              title: "Book 1",
              author: "Author 1",
              isbn: "1111111111111",
              shelfLocation: "A1",
            },
            borrower: { id: 1, name: "John", email: "john@example.com" },
          },
          {
            id: 2,
            dueDate: new Date("2023-01-15"),
            returnDate: null,
            book: {
              id: 2,
              title: "Book 2",
              author: "Author 2",
              isbn: "2222222222222",
              shelfLocation: "A2",
            },
            borrower: { id: 2, name: "Jane", email: "jane@example.com" },
          },
        ];
        const currentDate = new Date("2023-01-05");

        const result = ModelTransformers.borrowing.toOverdueMany(
          borrowings,
          currentDate
        );

        expect(result).toHaveLength(1); // Only first borrowing is overdue
        expect(result[0].id).toBe(1);
        expect(result[0].daysOverdue).toBe(4);
      });

      it("should return empty array for non-array input", () => {
        expect(ModelTransformers.borrowing.toOverdueMany(null)).toEqual([]);
        expect(ModelTransformers.borrowing.toOverdueMany("not array")).toEqual(
          []
        );
      });
    });
  });

  describe("Generic Utilities", () => {
    describe("dbErrorToApiError", () => {
      it("should handle unique constraint violation (23505)", () => {
        const dbError = {
          code: "23505",
          detail: "Key (email)=(test@example.com) already exists.",
        };

        const result = ModelTransformers.generic.dbErrorToApiError(dbError);

        expect(result.error.code).toBe("DUPLICATE_VALUE");
        expect(result.error.message).toBe("email already exists");
        expect(result.error.details[0].field).toBe("email");
      });

      it("should handle foreign key constraint violation (23503)", () => {
        const dbError = { code: "23503" };

        const result = ModelTransformers.generic.dbErrorToApiError(dbError);

        expect(result.error.code).toBe("REFERENCE_ERROR");
        expect(result.error.message).toBe("Referenced record does not exist");
      });

      it("should handle check constraint violation (23514)", () => {
        const dbError = {
          code: "23514",
          detail: "Failing row contains (available_quantity = -1)",
        };

        const result = ModelTransformers.generic.dbErrorToApiError(dbError);

        expect(result.error.code).toBe("CONSTRAINT_VIOLATION");
        expect(result.error.message).toBe("Data violates database constraints");
      });

      it("should handle generic database errors", () => {
        const dbError = { code: "UNKNOWN_ERROR" };

        const result = ModelTransformers.generic.dbErrorToApiError(dbError);

        expect(result.error.code).toBe("DATABASE_ERROR");
        expect(result.error.message).toBe(
          "An error occurred while processing your request"
        );
      });
    });

    describe("successResponse", () => {
      it("should create success response with data", () => {
        const data = { id: 1, name: "Test" };
        const result = ModelTransformers.generic.successResponse(data);

        expect(result).toEqual({ data });
      });

      it("should include message when provided", () => {
        const data = { id: 1 };
        const message = "Operation successful";
        const result = ModelTransformers.generic.successResponse(data, message);

        expect(result).toEqual({ data, message });
      });
    });

    describe("errorResponse", () => {
      it("should create error response", () => {
        const result = ModelTransformers.generic.errorResponse(
          "NOT_FOUND",
          "Resource not found"
        );

        expect(result).toEqual({
          error: {
            code: "NOT_FOUND",
            message: "Resource not found",
          },
        });
      });

      it("should include details when provided", () => {
        const details = [{ field: "id", message: "Invalid ID" }];
        const result = ModelTransformers.generic.errorResponse(
          "VALIDATION_ERROR",
          "Invalid input",
          details
        );

        expect(result.error.details).toEqual(details);
      });
    });
  });
});
