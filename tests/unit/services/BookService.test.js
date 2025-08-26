const BookService = require("../../../src/services/BookService");

// Mock dependencies
const mockBookRepository = {
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  findById: jest.fn(),
  findAll: jest.fn(),
  search: jest.fn(),
};

const mockBorrowingRepository = {
  findByBorrower: jest.fn(),
};

// Mock winston
jest.mock("winston", () => ({
  debug: jest.fn(),
  info: jest.fn(),
  error: jest.fn(),
}));

describe("BookService", () => {
  let bookService;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create service instance with mocked dependencies
    bookService = new BookService(mockBookRepository, mockBorrowingRepository);
  });

  describe("createBook", () => {
    const validBookData = {
      title: "Test Book",
      author: "Test Author",
      isbn: "1234567890123",
      totalQuantity: 5,
      shelfLocation: "A1",
    };

    it("should create a book successfully with valid data", async () => {
      const expectedBook = { id: 1, ...validBookData, availableQuantity: 5 };
      mockBookRepository.create.mockResolvedValue(expectedBook);

      const result = await bookService.createBook(validBookData);

      expect(mockBookRepository.create).toHaveBeenCalledWith({
        ...validBookData,
        availableQuantity: 5,
      });
      expect(result).toEqual(expectedBook);
    });

    it("should throw error for missing title", async () => {
      const invalidData = { ...validBookData };
      delete invalidData.title;

      await expect(bookService.createBook(invalidData)).rejects.toThrow(
        "Title is required and must be a string"
      );
    });

    it("should throw error for missing author", async () => {
      const invalidData = { ...validBookData };
      delete invalidData.author;

      await expect(bookService.createBook(invalidData)).rejects.toThrow(
        "Author is required and must be a string"
      );
    });

    it("should throw error for missing ISBN", async () => {
      const invalidData = { ...validBookData };
      delete invalidData.isbn;

      await expect(bookService.createBook(invalidData)).rejects.toThrow(
        "ISBN is required and must be a string"
      );
    });

    it("should throw error for invalid ISBN format", async () => {
      const invalidData = { ...validBookData, isbn: "123" };

      await expect(bookService.createBook(invalidData)).rejects.toThrow(
        "ISBN must be exactly 13 digits"
      );
    });

    it("should throw error for zero or negative total quantity", async () => {
      const invalidData = { ...validBookData, totalQuantity: 0 };

      await expect(bookService.createBook(invalidData)).rejects.toThrow(
        "Total quantity must be greater than 0"
      );
    });

    it("should throw error for missing shelf location", async () => {
      const invalidData = { ...validBookData };
      delete invalidData.shelfLocation;

      await expect(bookService.createBook(invalidData)).rejects.toThrow(
        "Shelf location is required and must be a string"
      );
    });
  });

  describe("updateBook", () => {
    const existingBook = {
      id: 1,
      title: "Existing Book",
      author: "Existing Author",
      isbn: "1234567890123",
      totalQuantity: 5,
      availableQuantity: 3,
      shelfLocation: "A1",
    };

    it("should update book successfully", async () => {
      const updateData = { title: "Updated Title" };
      const updatedBook = { ...existingBook, ...updateData };

      mockBookRepository.findById.mockResolvedValue(existingBook);
      mockBookRepository.update.mockResolvedValue(updatedBook);

      const result = await bookService.updateBook(1, updateData);

      expect(mockBookRepository.findById).toHaveBeenCalledWith(1);
      expect(mockBookRepository.update).toHaveBeenCalledWith(1, updateData);
      expect(result).toEqual(updatedBook);
    });

    it("should throw error if book not found", async () => {
      mockBookRepository.findById.mockResolvedValue(null);

      await expect(
        bookService.updateBook(999, { title: "New Title" })
      ).rejects.toThrow("Book not found");
    });

    it("should validate total quantity update", async () => {
      mockBookRepository.findById.mockResolvedValue(existingBook);

      // Try to set total quantity below borrowed quantity (5 total - 3 available = 2 borrowed)
      await expect(
        bookService.updateBook(1, { totalQuantity: 1 })
      ).rejects.toThrow(
        "Cannot reduce total quantity below borrowed quantity (2)"
      );
    });

    it("should allow valid total quantity update", async () => {
      const updateData = { totalQuantity: 10 };
      const updatedBook = { ...existingBook, ...updateData };

      mockBookRepository.findById.mockResolvedValue(existingBook);
      mockBookRepository.update.mockResolvedValue(updatedBook);

      const result = await bookService.updateBook(1, updateData);

      expect(result).toEqual(updatedBook);
    });
  });

  describe("deleteBook", () => {
    const existingBook = {
      id: 1,
      title: "Test Book",
      author: "Test Author",
      isbn: "1234567890123",
      totalQuantity: 5,
      availableQuantity: 5,
      shelfLocation: "A1",
    };

    it("should delete book successfully when no active borrowings", async () => {
      mockBookRepository.findById.mockResolvedValue(existingBook);
      mockBorrowingRepository.findByBorrower.mockResolvedValue([]);
      mockBookRepository.delete.mockResolvedValue(true);

      const result = await bookService.deleteBook(1);

      expect(mockBookRepository.findById).toHaveBeenCalledWith(1);
      expect(mockBorrowingRepository.findByBorrower).toHaveBeenCalledWith(
        null,
        { activeOnly: true }
      );
      expect(mockBookRepository.delete).toHaveBeenCalledWith(1);
      expect(result).toBe(true);
    });

    it("should throw error if book not found", async () => {
      mockBookRepository.findById.mockResolvedValue(null);

      await expect(bookService.deleteBook(999)).rejects.toThrow(
        "Book not found"
      );
    });

    it("should throw error if book has active borrowings", async () => {
      const activeBorrowings = [
        { id: 1, bookId: 1, borrowerId: 1, returnDate: null },
      ];

      mockBookRepository.findById.mockResolvedValue(existingBook);
      mockBorrowingRepository.findByBorrower.mockResolvedValue(
        activeBorrowings
      );

      await expect(bookService.deleteBook(1)).rejects.toThrow(
        "Cannot delete book with active borrowings"
      );
    });
  });

  describe("getAllBooks", () => {
    it("should return all books with pagination", async () => {
      const books = [
        { id: 1, title: "Book 1" },
        { id: 2, title: "Book 2" },
      ];
      const options = { limit: 10, offset: 0 };

      mockBookRepository.findAll.mockResolvedValue(books);

      const result = await bookService.getAllBooks(options);

      expect(mockBookRepository.findAll).toHaveBeenCalledWith(options);
      expect(result).toEqual(books);
    });
  });

  describe("searchBooks", () => {
    it("should search books by criteria", async () => {
      const books = [{ id: 1, title: "Test Book" }];
      const criteria = { title: "Test" };

      mockBookRepository.search.mockResolvedValue(books);

      const result = await bookService.searchBooks(criteria);

      expect(mockBookRepository.search).toHaveBeenCalledWith(criteria);
      expect(result).toEqual(books);
    });
  });

  describe("getBookById", () => {
    it("should return book when found", async () => {
      const book = { id: 1, title: "Test Book" };

      mockBookRepository.findById.mockResolvedValue(book);

      const result = await bookService.getBookById(1);

      expect(mockBookRepository.findById).toHaveBeenCalledWith(1);
      expect(result).toEqual(book);
    });

    it("should return null when book not found", async () => {
      mockBookRepository.findById.mockResolvedValue(null);

      const result = await bookService.getBookById(999);

      expect(result).toBeNull();
    });
  });

  describe("isBookAvailable", () => {
    it("should return true when book is available", async () => {
      const book = { id: 1, availableQuantity: 3 };

      mockBookRepository.findById.mockResolvedValue(book);

      const result = await bookService.isBookAvailable(1);

      expect(result).toBe(true);
    });

    it("should return false when book is not available", async () => {
      const book = { id: 1, availableQuantity: 0 };

      mockBookRepository.findById.mockResolvedValue(book);

      const result = await bookService.isBookAvailable(1);

      expect(result).toBe(false);
    });

    it("should return false when book not found", async () => {
      mockBookRepository.findById.mockResolvedValue(null);

      const result = await bookService.isBookAvailable(999);

      expect(result).toBe(false);
    });
  });

  describe("updateBookAvailability", () => {
    const existingBook = {
      id: 1,
      totalQuantity: 5,
      availableQuantity: 3,
    };

    it("should update availability successfully", async () => {
      const updatedBook = { ...existingBook, availableQuantity: 2 };

      mockBookRepository.findById.mockResolvedValue(existingBook);
      mockBookRepository.update.mockResolvedValue(updatedBook);

      const result = await bookService.updateBookAvailability(1, -1);

      expect(mockBookRepository.findById).toHaveBeenCalledWith(1);
      expect(mockBookRepository.update).toHaveBeenCalledWith(1, {
        availableQuantity: 2,
      });
      expect(result).toEqual(updatedBook);
    });

    it("should throw error if book not found", async () => {
      mockBookRepository.findById.mockResolvedValue(null);

      await expect(bookService.updateBookAvailability(999, -1)).rejects.toThrow(
        "Book not found"
      );
    });

    it("should throw error if availability would become negative", async () => {
      mockBookRepository.findById.mockResolvedValue(existingBook);

      await expect(bookService.updateBookAvailability(1, -5)).rejects.toThrow(
        "Available quantity cannot be negative"
      );
    });

    it("should throw error if availability would exceed total quantity", async () => {
      mockBookRepository.findById.mockResolvedValue(existingBook);

      await expect(bookService.updateBookAvailability(1, 5)).rejects.toThrow(
        "Available quantity cannot exceed total quantity"
      );
    });
  });
});
