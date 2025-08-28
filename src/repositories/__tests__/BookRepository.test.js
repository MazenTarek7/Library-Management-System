const BookRepository = require("../BookRepository");
const prisma = require("../../config/prisma");
const Book = require("../../models/Book");

// Mock Prisma
jest.mock("../../config/prisma", () => ({
  book: {
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
  },
}));

// Mock winston
jest.mock("winston", () => ({
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

describe("BookRepository", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("create", () => {
    it("should create a new book successfully", async () => {
      const bookData = {
        title: "Test Book",
        author: "Test Author",
        isbn: "1234567890123",
        totalQuantity: 5,
        shelfLocation: "A1",
      };

      const mockCreatedBook = {
        id: 1,
        title: "Test Book",
        author: "Test Author",
        isbn: "1234567890123",
        totalQuantity: 5,
        availableQuantity: 5,
        shelfLocation: "A1",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.book.create.mockResolvedValue(mockCreatedBook);

      const result = await BookRepository.create(bookData);

      expect(prisma.book.create).toHaveBeenCalledWith({
        data: {
          title: "Test Book",
          author: "Test Author",
          isbn: "1234567890123",
          totalQuantity: 5,
          availableQuantity: 5,
          shelfLocation: "A1",
        },
      });

      expect(result).toEqual(Book.fromDatabaseRow(mockCreatedBook));
    });

    it("should throw error when creation fails", async () => {
      const bookData = {
        title: "Test Book",
        author: "Test Author",
        isbn: "1234567890123",
        totalQuantity: 5,
        shelfLocation: "A1",
      };

      const error = new Error("Database error");
      prisma.book.create.mockRejectedValue(error);

      await expect(BookRepository.create(bookData)).rejects.toThrow(
        "Database error"
      );
    });
  });

  describe("update", () => {
    it("should update a book successfully", async () => {
      const updateData = {
        title: "Updated Title",
        totalQuantity: 10,
      };

      const mockUpdatedBook = {
        id: 1,
        title: "Updated Title",
        author: "Test Author",
        isbn: "1234567890123",
        totalQuantity: 10,
        availableQuantity: 8,
        shelfLocation: "A1",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.book.update.mockResolvedValue(mockUpdatedBook);

      const result = await BookRepository.update(1, updateData);

      expect(prisma.book.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          title: "Updated Title",
          totalQuantity: 10,
        },
      });

      expect(result).toEqual(Book.fromDatabaseRow(mockUpdatedBook));
    });

    it("should return null when book not found", async () => {
      const updateData = { title: "Updated Title" };
      const error = new Error("Record not found");
      error.code = "P2025";

      prisma.book.update.mockRejectedValue(error);

      const result = await BookRepository.update(999, updateData);

      expect(result).toBeNull();
    });

    it("should throw error for other database errors", async () => {
      const updateData = { title: "Updated Title" };
      const error = new Error("Database error");

      prisma.book.update.mockRejectedValue(error);

      await expect(BookRepository.update(1, updateData)).rejects.toThrow(
        "Database error"
      );
    });
  });

  describe("delete", () => {
    it("should delete a book successfully", async () => {
      prisma.book.delete.mockResolvedValue({ id: 1 });

      const result = await BookRepository.delete(1);

      expect(prisma.book.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });

      expect(result).toBe(true);
    });

    it("should return false when book not found", async () => {
      const error = new Error("Record not found");
      error.code = "P2025";

      prisma.book.delete.mockRejectedValue(error);

      const result = await BookRepository.delete(999);

      expect(result).toBe(false);
    });

    it("should throw error for other database errors", async () => {
      const error = new Error("Database error");

      prisma.book.delete.mockRejectedValue(error);

      await expect(BookRepository.delete(1)).rejects.toThrow("Database error");
    });
  });

  describe("findById", () => {
    it("should find a book by ID successfully", async () => {
      const mockBook = {
        id: 1,
        title: "Test Book",
        author: "Test Author",
        isbn: "1234567890123",
        totalQuantity: 5,
        availableQuantity: 5,
        shelfLocation: "A1",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.book.findUnique.mockResolvedValue(mockBook);

      const result = await BookRepository.findById(1);

      expect(prisma.book.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });

      expect(result).toEqual(Book.fromDatabaseRow(mockBook));
    });

    it("should return null when book not found", async () => {
      prisma.book.findUnique.mockResolvedValue(null);

      const result = await BookRepository.findById(999);

      expect(result).toBeNull();
    });

    it("should throw error when database error occurs", async () => {
      const error = new Error("Database error");
      prisma.book.findUnique.mockRejectedValue(error);

      await expect(BookRepository.findById(1)).rejects.toThrow(
        "Database error"
      );
    });
  });

  describe("findAll", () => {
    it("should find all books without pagination", async () => {
      const mockBooks = [
        {
          id: 1,
          title: "Book 1",
          author: "Author 1",
          isbn: "1111111111111",
          totalQuantity: 5,
          availableQuantity: 5,
          shelfLocation: "A1",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 2,
          title: "Book 2",
          author: "Author 2",
          isbn: "2222222222222",
          totalQuantity: 3,
          availableQuantity: 2,
          shelfLocation: "B1",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      prisma.book.findMany.mockResolvedValue(mockBooks);

      const result = await BookRepository.findAll();

      expect(prisma.book.findMany).toHaveBeenCalledWith({});
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(Book.fromDatabaseRow(mockBooks[0]));
      expect(result[1]).toEqual(Book.fromDatabaseRow(mockBooks[1]));
    });

    it("should find all books with pagination", async () => {
      const mockBooks = [
        {
          id: 1,
          title: "Book 1",
          author: "Author 1",
          isbn: "1111111111111",
          totalQuantity: 5,
          availableQuantity: 5,
          shelfLocation: "A1",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      prisma.book.findMany.mockResolvedValue(mockBooks);

      const result = await BookRepository.findAll({ limit: 10, offset: 5 });

      expect(prisma.book.findMany).toHaveBeenCalledWith({
        take: 10,
        skip: 5,
      });

      expect(result).toHaveLength(1);
    });

    it("should throw error when database error occurs", async () => {
      const error = new Error("Database error");
      prisma.book.findMany.mockRejectedValue(error);

      await expect(BookRepository.findAll()).rejects.toThrow("Database error");
    });
  });

  describe("search", () => {
    it("should search books by title", async () => {
      const mockBooks = [
        {
          id: 1,
          title: "JavaScript Guide",
          author: "John Doe",
          isbn: "1111111111111",
          totalQuantity: 5,
          availableQuantity: 5,
          shelfLocation: "A1",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      prisma.book.findMany.mockResolvedValue(mockBooks);

      const result = await BookRepository.search({ title: "JavaScript" });

      expect(prisma.book.findMany).toHaveBeenCalledWith({
        where: {
          title: {
            contains: "JavaScript",
            mode: "insensitive",
          },
        },
      });

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(Book.fromDatabaseRow(mockBooks[0]));
    });

    it("should search books by author", async () => {
      const mockBooks = [
        {
          id: 1,
          title: "Test Book",
          author: "John Doe",
          isbn: "1111111111111",
          totalQuantity: 5,
          availableQuantity: 5,
          shelfLocation: "A1",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      prisma.book.findMany.mockResolvedValue(mockBooks);

      const result = await BookRepository.search({ author: "John" });

      expect(prisma.book.findMany).toHaveBeenCalledWith({
        where: {
          author: {
            contains: "John",
            mode: "insensitive",
          },
        },
      });

      expect(result).toHaveLength(1);
    });

    it("should search books by ISBN", async () => {
      const mockBooks = [
        {
          id: 1,
          title: "Test Book",
          author: "John Doe",
          isbn: "1234567890123",
          totalQuantity: 5,
          availableQuantity: 5,
          shelfLocation: "A1",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      prisma.book.findMany.mockResolvedValue(mockBooks);

      const result = await BookRepository.search({ isbn: "1234567890123" });

      expect(prisma.book.findMany).toHaveBeenCalledWith({
        where: {
          isbn: "1234567890123",
        },
      });

      expect(result).toHaveLength(1);
    });

    it("should search with multiple criteria and pagination", async () => {
      const mockBooks = [];

      prisma.book.findMany.mockResolvedValue(mockBooks);

      const result = await BookRepository.search({
        title: "JavaScript",
        author: "John",
        limit: 5,
        offset: 10,
      });

      expect(prisma.book.findMany).toHaveBeenCalledWith({
        where: {
          title: {
            contains: "JavaScript",
            mode: "insensitive",
          },
          author: {
            contains: "John",
            mode: "insensitive",
          },
        },
        take: 5,
        skip: 10,
      });

      expect(result).toHaveLength(0);
    });

    it("should throw error when database error occurs", async () => {
      const error = new Error("Database error");
      prisma.book.findMany.mockRejectedValue(error);

      await expect(BookRepository.search({ title: "Test" })).rejects.toThrow(
        "Database error"
      );
    });
  });
});
