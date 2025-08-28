const prisma = require("../config/prisma");
const logger = require("../config/logger");

/**
 * Database seeding utility for test data using Prisma
 */
class Seeder {
  /**
   * Sample books data
   */
  static getSampleBooks() {
    return [
      {
        title: "The Great Gatsby",
        author: "F. Scott Fitzgerald",
        isbn: "9780743273565",
        totalQuantity: 5,
        availableQuantity: 5,
        shelfLocation: "A1-001",
      },
      {
        title: "To Kill a Mockingbird",
        author: "Harper Lee",
        isbn: "9780061120084",
        totalQuantity: 3,
        availableQuantity: 3,
        shelfLocation: "A1-002",
      },
      {
        title: "1984",
        author: "George Orwell",
        isbn: "9780451524935",
        totalQuantity: 4,
        availableQuantity: 4,
        shelfLocation: "A2-001",
      },
      {
        title: "Pride and Prejudice",
        author: "Jane Austen",
        isbn: "9780141439518",
        totalQuantity: 2,
        availableQuantity: 2,
        shelfLocation: "B1-001",
      },
      {
        title: "The Catcher in the Rye",
        author: "J.D. Salinger",
        isbn: "9780316769174",
        totalQuantity: 3,
        availableQuantity: 2,
        shelfLocation: "B1-002",
      },
    ];
  }

  /**
   * Sample borrowers data
   */
  static getSampleBorrowers() {
    return [
      {
        name: "John Doe",
        email: "john.doe@email.com",
        registeredDate: new Date("2024-01-15"),
      },
      {
        name: "Jane Smith",
        email: "jane.smith@email.com",
        registeredDate: new Date("2024-02-01"),
      },
      {
        name: "Bob Johnson",
        email: "bob.johnson@email.com",
        registeredDate: new Date("2024-02-15"),
      },
      {
        name: "Alice Brown",
        email: "alice.brown@email.com",
        registeredDate: new Date("2024-03-01"),
      },
    ];
  }

  /**
   * Sample borrowings data (some active, some returned, some overdue)
   */
  static getSampleBorrowings() {
    const today = new Date();
    const pastDate = new Date(today);
    pastDate.setDate(today.getDate() - 20);

    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + 10);

    const overdueDate = new Date(today);
    overdueDate.setDate(today.getDate() - 5);

    // Calculate last month's date range
    const lastMonthStart = new Date(
      today.getFullYear(),
      today.getMonth() - 1,
      1
    );
    const lastMonthEnd = new Date(
      today.getFullYear(),
      today.getMonth(),
      0,
      23,
      59,
      59,
      999
    );

    // Pick concrete dates inside last month for deterministic seeding
    const lastMonthCheckout1 = new Date(
      lastMonthStart.getFullYear(),
      lastMonthStart.getMonth(),
      Math.min(5, lastMonthEnd.getDate())
    );
    const lastMonthDue1 = new Date(lastMonthCheckout1);
    lastMonthDue1.setDate(lastMonthCheckout1.getDate() + 14);
    const lastMonthReturn1 = new Date(lastMonthCheckout1);
    lastMonthReturn1.setDate(lastMonthCheckout1.getDate() + 10);

    const lastMonthCheckout2 = new Date(
      lastMonthStart.getFullYear(),
      lastMonthStart.getMonth(),
      Math.min(2, lastMonthEnd.getDate())
    );
    const lastMonthDue2 = new Date(lastMonthEnd);
    lastMonthDue2.setDate(lastMonthEnd.getDate() - 2);

    return [
      {
        borrowerId: 1,
        bookId: 5, // The Catcher in the Rye (making it unavailable)
        checkoutDate: pastDate,
        dueDate: futureDate,
        returnDate: null, // Active borrowing
      },
      {
        borrowerId: 2,
        bookId: 1, // The Great Gatsby
        checkoutDate: new Date("2024-01-01"),
        dueDate: new Date("2024-01-15"),
        returnDate: new Date("2024-01-14"), // Returned on time
      },
      {
        borrowerId: 3,
        bookId: 2, // To Kill a Mockingbird
        checkoutDate: pastDate,
        dueDate: overdueDate,
        returnDate: null, // Overdue borrowing
      },
      // Last-month borrowing (returned within last month)
      {
        borrowerId: 4,
        bookId: 3, // 1984
        checkoutDate: lastMonthCheckout1,
        dueDate: lastMonthDue1,
        returnDate: lastMonthReturn1,
      },
      // Last-month overdue (due date last month, not returned)
      {
        borrowerId: 1,
        bookId: 4, // Pride and Prejudice
        checkoutDate: lastMonthCheckout2,
        dueDate: lastMonthDue2,
        returnDate: null,
      },
    ];
  }

  /**
   * Seed books table
   */
  static async seedBooks() {
    const books = this.getSampleBooks();

    try {
      for (const book of books) {
        await prisma.book.upsert({
          where: { isbn: book.isbn },
          update: {},
          create: book,
        });
      }
      logger.info(`Seeded ${books.length} books`);
    } catch (error) {
      logger.error("Error seeding books", { error: error.message });
      throw error;
    }
  }

  /**
   * Seed borrowers table
   */
  static async seedBorrowers() {
    const borrowers = this.getSampleBorrowers();

    try {
      for (const borrower of borrowers) {
        await prisma.borrower.upsert({
          where: { email: borrower.email },
          update: {},
          create: borrower,
        });
      }
      logger.info(`Seeded ${borrowers.length} borrowers`);
    } catch (error) {
      logger.error("Error seeding borrowers", { error: error.message });
      throw error;
    }
  }

  /**
   * Seed borrowings table
   */
  static async seedBorrowings() {
    const borrowings = this.getSampleBorrowings();

    try {
      // Clear existing borrowings first to avoid duplicates
      await prisma.borrowing.deleteMany({});

      for (const borrowing of borrowings) {
        await prisma.borrowing.create({
          data: borrowing,
        });
      }
      logger.info(`Seeded ${borrowings.length} borrowings`);
    } catch (error) {
      logger.error("Error seeding borrowings", { error: error.message });
      throw error;
    }
  }

  /**
   * Seed all tables with sample data
   */
  static async seedAll() {
    try {
      logger.info("Starting database seeding...");

      await this.seedBooks();
      await this.seedBorrowers();
      await this.seedBorrowings();

      logger.info("Database seeding completed successfully");
    } catch (error) {
      logger.error("Database seeding failed", { error: error.message });
      throw error;
    }
  }

  /**
   * Clear all data from tables (for testing)
   */
  static async clearAll() {
    try {
      logger.info("Clearing all data from tables...");

      // Delete in order to respect foreign key constraints
      await prisma.borrowing.deleteMany({});
      await prisma.borrower.deleteMany({});
      await prisma.book.deleteMany({});

      logger.info("All data cleared successfully");
    } catch (error) {
      logger.error("Error clearing data", { error: error.message });
      throw error;
    }
  }
}

module.exports = Seeder;
