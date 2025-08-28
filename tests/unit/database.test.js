const DatabaseUtil = require("../../src/utils/database");
const Seeder = require("../../src/utils/seeder");

// Mock winston to avoid console output during tests
jest.mock("winston", () => ({
  info: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn(),
}));

// Mock Prisma client
jest.mock("../../src/config/prisma", () => ({
  $queryRaw: jest.fn(),
  $transaction: jest.fn(),
  $disconnect: jest.fn(),
  book: {
    upsert: jest.fn(),
  },
  borrower: {
    upsert: jest.fn(),
  },
  borrowing: {
    create: jest.fn(),
    deleteMany: jest.fn(),
  },
}));

describe("Database Utilities", () => {
  describe("DatabaseUtil", () => {
    test("should have required methods", () => {
      expect(typeof DatabaseUtil.testConnection).toBe("function");
      expect(typeof DatabaseUtil.rawQuery).toBe("function");
      expect(typeof DatabaseUtil.transaction).toBe("function");
      expect(typeof DatabaseUtil.getConnectionInfo).toBe("function");
      expect(typeof DatabaseUtil.disconnect).toBe("function");
      expect(typeof DatabaseUtil.getClient).toBe("function");
    });

    test("should return Prisma client", () => {
      const client = DatabaseUtil.getClient();
      expect(client).toBeDefined();
    });
  });

  describe("Seeder", () => {
    test("should have sample data methods", () => {
      expect(typeof Seeder.getSampleBooks).toBe("function");
      expect(typeof Seeder.getSampleBorrowers).toBe("function");
      expect(typeof Seeder.getSampleBorrowings).toBe("function");
    });

    test("should return valid sample books", () => {
      const books = Seeder.getSampleBooks();
      expect(Array.isArray(books)).toBe(true);
      expect(books.length).toBeGreaterThan(0);

      books.forEach((book) => {
        expect(book).toHaveProperty("title");
        expect(book).toHaveProperty("author");
        expect(book).toHaveProperty("isbn");
        expect(book).toHaveProperty("totalQuantity");
        expect(book).toHaveProperty("availableQuantity");
        expect(book).toHaveProperty("shelfLocation");
      });
    });

    test("should return valid sample borrowers", () => {
      const borrowers = Seeder.getSampleBorrowers();
      expect(Array.isArray(borrowers)).toBe(true);
      expect(borrowers.length).toBeGreaterThan(0);

      borrowers.forEach((borrower) => {
        expect(borrower).toHaveProperty("name");
        expect(borrower).toHaveProperty("email");
        expect(borrower).toHaveProperty("registeredDate");
        expect(borrower.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
        expect(borrower.registeredDate).toBeInstanceOf(Date);
      });
    });

    test("should return valid sample borrowings", () => {
      const borrowings = Seeder.getSampleBorrowings();
      expect(Array.isArray(borrowings)).toBe(true);
      expect(borrowings.length).toBeGreaterThan(0);

      borrowings.forEach((borrowing) => {
        expect(borrowing).toHaveProperty("borrowerId");
        expect(borrowing).toHaveProperty("bookId");
        expect(borrowing).toHaveProperty("checkoutDate");
        expect(borrowing).toHaveProperty("dueDate");
        expect(borrowing).toHaveProperty("returnDate");
        expect(borrowing.checkoutDate).toBeInstanceOf(Date);
        expect(borrowing.dueDate).toBeInstanceOf(Date);
      });
    });
  });
});
