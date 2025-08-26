const { Book, Borrower, Borrowing } = require("../../src/models");

describe("Model Classes", () => {
  describe("Book Model", () => {
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

    const mockBookData = {
      title: "Test Book",
      author: "Test Author",
      isbn: "1234567890123",
      totalQuantity: 5,
      shelfLocation: "A1-B2",
    };

    describe("fromDatabaseRow", () => {
      it("should transform database row to Book model", () => {
        const book = Book.fromDatabaseRow(mockBookRow);

        expect(book).toEqual({
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

      it("should return null for null input", () => {
        expect(Book.fromDatabaseRow(null)).toBeNull();
      });
    });

    describe("toDatabaseRow", () => {
      it("should transform Book data to database row format", () => {
        const row = Book.toDatabaseRow(mockBookData);

        expect(row).toEqual({
          title: "Test Book",
          author: "Test Author",
          isbn: "1234567890123",
          total_quantity: 5,
          available_quantity: 5, // Should default to total_quantity
          shelf_location: "A1-B2",
        });
      });

      it("should handle partial updates", () => {
        const partialData = { title: "Updated Title", totalQuantity: 10 };
        const row = Book.toDatabaseRow(partialData);

        expect(row).toEqual({
          title: "Updated Title",
          total_quantity: 10,
          available_quantity: 10,
        });
      });

      it("should preserve availableQuantity if provided", () => {
        const dataWithAvailable = { ...mockBookData, availableQuantity: 2 };
        const row = Book.toDatabaseRow(dataWithAvailable);

        expect(row.available_quantity).toBe(2);
      });
    });

    describe("isAvailable", () => {
      it("should return true when book has available quantity", () => {
        const book = { availableQuantity: 3 };
        expect(Book.isAvailable(book)).toBe(true);
      });

      it("should return false when book has no available quantity", () => {
        const book = { availableQuantity: 0 };
        expect(Book.isAvailable(book)).toBe(false);
      });

      it("should return false for null book", () => {
        expect(Book.isAvailable(null)).toBe(false);
      });
    });

    describe("getAvailabilityStatus", () => {
      it('should return "available" when all copies are available', () => {
        const book = { totalQuantity: 5, availableQuantity: 5 };
        expect(Book.getAvailabilityStatus(book)).toBe("available");
      });

      it('should return "partially_available" when some copies are available', () => {
        const book = { totalQuantity: 5, availableQuantity: 3 };
        expect(Book.getAvailabilityStatus(book)).toBe("partially_available");
      });

      it('should return "unavailable" when no copies are available', () => {
        const book = { totalQuantity: 5, availableQuantity: 0 };
        expect(Book.getAvailabilityStatus(book)).toBe("unavailable");
      });

      it('should return "unknown" for null book', () => {
        expect(Book.getAvailabilityStatus(null)).toBe("unknown");
      });
    });
  });

  describe("Borrower Model", () => {
    const mockBorrowerRow = {
      id: 1,
      name: "John Doe",
      email: "john.doe@example.com",
      registered_date: "2023-01-01",
      created_at: "2023-01-01T00:00:00Z",
      updated_at: "2023-01-01T00:00:00Z",
    };

    const mockBorrowerData = {
      name: "John Doe",
      email: "John.Doe@Example.com",
    };

    describe("fromDatabaseRow", () => {
      it("should transform database row to Borrower model", () => {
        const borrower = Borrower.fromDatabaseRow(mockBorrowerRow);

        expect(borrower).toEqual({
          id: 1,
          name: "John Doe",
          email: "john.doe@example.com",
          registeredDate: new Date("2023-01-01"),
          createdAt: new Date("2023-01-01T00:00:00Z"),
          updatedAt: new Date("2023-01-01T00:00:00Z"),
        });
      });

      it("should return null for null input", () => {
        expect(Borrower.fromDatabaseRow(null)).toBeNull();
      });
    });

    describe("toDatabaseRow", () => {
      it("should transform Borrower data to database row format", () => {
        const row = Borrower.toDatabaseRow(mockBorrowerData);

        expect(row).toEqual({
          name: "John Doe",
          email: "john.doe@example.com", // Should be lowercase
        });
      });

      it("should handle partial updates", () => {
        const partialData = { name: "Jane Doe" };
        const row = Borrower.toDatabaseRow(partialData);

        expect(row).toEqual({
          name: "Jane Doe",
        });
      });
    });

    describe("isValidEmail", () => {
      it("should return true for valid email addresses", () => {
        const validEmails = [
          "test@example.com",
          "user.name@domain.co.uk",
          "user+tag@example.org",
        ];

        validEmails.forEach((email) => {
          expect(Borrower.isValidEmail(email)).toBe(true);
        });
      });

      it("should return false for invalid email addresses", () => {
        const invalidEmails = [
          "invalid-email",
          "@example.com",
          "user@",
          "user@.com",
          "user name@example.com",
        ];

        invalidEmails.forEach((email) => {
          expect(Borrower.isValidEmail(email)).toBe(false);
        });
      });
    });

    describe("normalizeEmail", () => {
      it("should convert email to lowercase and trim whitespace", () => {
        expect(Borrower.normalizeEmail("  John.Doe@EXAMPLE.COM  ")).toBe(
          "john.doe@example.com"
        );
      });

      it("should handle null and undefined", () => {
        expect(Borrower.normalizeEmail(null)).toBe("");
        expect(Borrower.normalizeEmail(undefined)).toBe("");
      });
    });
  });

  describe("Borrowing Model", () => {
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

    const mockBorrowingData = {
      borrowerId: 1,
      bookId: 1,
    };

    describe("fromDatabaseRow", () => {
      it("should transform database row to Borrowing model", () => {
        const borrowing = Borrowing.fromDatabaseRow(mockBorrowingRow);

        expect(borrowing).toEqual({
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

      it("should include populated book and borrower data", () => {
        const rowWithPopulated = {
          ...mockBorrowingRow,
          book_title: "Test Book",
          book_author: "Test Author",
          book_isbn: "1234567890123",
          book_shelf_location: "A1-B2",
          borrower_name: "John Doe",
          borrower_email: "john@example.com",
        };

        const borrowing = Borrowing.fromDatabaseRow(rowWithPopulated);

        expect(borrowing.book).toEqual({
          id: 1,
          title: "Test Book",
          author: "Test Author",
          isbn: "1234567890123",
          shelfLocation: "A1-B2",
        });

        expect(borrowing.borrower).toEqual({
          id: 1,
          name: "John Doe",
          email: "john@example.com",
        });
      });

      it("should return null for null input", () => {
        expect(Borrowing.fromDatabaseRow(null)).toBeNull();
      });
    });

    describe("toDatabaseRow", () => {
      it("should transform Borrowing data to database row format", () => {
        const row = Borrowing.toDatabaseRow(mockBorrowingData);

        expect(row.borrower_id).toBe(1);
        expect(row.book_id).toBe(1);
        expect(row.checkout_date).toBeInstanceOf(Date);
        expect(row.due_date).toBeInstanceOf(Date);

        // Due date should be 14 days after checkout date
        const daysDiff =
          (row.due_date - row.checkout_date) / (1000 * 60 * 60 * 24);
        expect(daysDiff).toBe(14);
      });
    });

    describe("calculateDueDate", () => {
      it("should calculate due date 14 days from checkout date", () => {
        const checkoutDate = new Date("2023-01-01");
        const dueDate = Borrowing.calculateDueDate(checkoutDate);

        expect(dueDate).toEqual(new Date("2023-01-15"));
      });

      it("should use current date if no checkout date provided", () => {
        const dueDate = Borrowing.calculateDueDate();
        const expectedDue = new Date();
        expectedDue.setDate(expectedDue.getDate() + 14);

        // Allow for small time differences in test execution
        expect(Math.abs(dueDate - expectedDue)).toBeLessThan(1000);
      });
    });

    describe("isOverdue", () => {
      it("should return true when due date has passed", () => {
        const borrowing = {
          dueDate: new Date("2023-01-01"),
          returnDate: null,
        };
        const currentDate = new Date("2023-01-02");

        expect(Borrowing.isOverdue(borrowing, currentDate)).toBe(true);
      });

      it("should return false when due date has not passed", () => {
        const borrowing = {
          dueDate: new Date("2023-01-15"),
          returnDate: null,
        };
        const currentDate = new Date("2023-01-01");

        expect(Borrowing.isOverdue(borrowing, currentDate)).toBe(false);
      });

      it("should return false when book is already returned", () => {
        const borrowing = {
          dueDate: new Date("2023-01-01"),
          returnDate: new Date("2023-01-02"),
        };
        const currentDate = new Date("2023-01-03");

        expect(Borrowing.isOverdue(borrowing, currentDate)).toBe(false);
      });

      it("should return false for null borrowing", () => {
        expect(Borrowing.isOverdue(null)).toBe(false);
      });
    });

    describe("getDaysOverdue", () => {
      it("should calculate days overdue correctly", () => {
        const borrowing = {
          dueDate: new Date("2023-01-01"),
          returnDate: null,
        };
        const currentDate = new Date("2023-01-05");

        expect(Borrowing.getDaysOverdue(borrowing, currentDate)).toBe(4);
      });

      it("should return 0 when not overdue", () => {
        const borrowing = {
          dueDate: new Date("2023-01-15"),
          returnDate: null,
        };
        const currentDate = new Date("2023-01-01");

        expect(Borrowing.getDaysOverdue(borrowing, currentDate)).toBe(0);
      });

      it("should return 0 when book is returned", () => {
        const borrowing = {
          dueDate: new Date("2023-01-01"),
          returnDate: new Date("2023-01-02"),
        };
        const currentDate = new Date("2023-01-05");

        expect(Borrowing.getDaysOverdue(borrowing, currentDate)).toBe(0);
      });
    });

    describe("isActive", () => {
      it("should return true when borrowing has no return date", () => {
        const borrowing = { returnDate: null };
        expect(Borrowing.isActive(borrowing)).toBe(true);
      });

      it("should return false when borrowing has return date", () => {
        const borrowing = { returnDate: new Date() };
        expect(Borrowing.isActive(borrowing)).toBe(false);
      });

      it("should return false for null borrowing", () => {
        expect(Borrowing.isActive(null)).toBe(false);
      });
    });

    describe("getStatus", () => {
      it('should return "returned" when book is returned', () => {
        const borrowing = { returnDate: new Date() };
        expect(Borrowing.getStatus(borrowing)).toBe("returned");
      });

      it('should return "overdue" when book is overdue', () => {
        const borrowing = {
          dueDate: new Date("2023-01-01"),
          returnDate: null,
        };
        const currentDate = new Date("2023-01-02");

        expect(Borrowing.getStatus(borrowing, currentDate)).toBe("overdue");
      });

      it('should return "active" when book is not overdue and not returned', () => {
        const borrowing = {
          dueDate: new Date("2023-01-15"),
          returnDate: null,
        };
        const currentDate = new Date("2023-01-01");

        expect(Borrowing.getStatus(borrowing, currentDate)).toBe("active");
      });

      it('should return "unknown" for null borrowing', () => {
        expect(Borrowing.getStatus(null)).toBe("unknown");
      });
    });
  });
});
