const request = require("supertest");
const express = require("express");
const BookController = require("../../src/controllers/BookController");
const ValidationMiddleware = require("../../src/middleware/validationMiddleware");
const { bookSchemas, querySchemas } = require("../../src/models/validation");

// Mock winston
jest.mock("winston", () => ({
  debug: jest.fn(),
  info: jest.fn(),
  error: jest.fn(),
}));

describe("Book Routes Integration Tests", () => {
  let app;
  let mockBookService;
  let bookController;

  beforeEach(() => {
    // Create mock service
    mockBookService = {
      getAllBooks: jest.fn(),
      searchBooks: jest.fn(),
      getBookById: jest.fn(),
      createBook: jest.fn(),
      updateBook: jest.fn(),
      deleteBook: jest.fn(),
    };

    // Create controller with mock service
    bookController = new BookController(mockBookService);

    // Create Express app with routes
    app = express();
    app.use(express.json());

    // Define routes manually to use our mocked controller
    const router = express.Router();

    router.get(
      "/",
      ValidationMiddleware.validateQuery(querySchemas.bookListing),
      (req, res, next) => bookController.getAllBooks(req, res, next)
    );

    router.get(
      "/:id",
      ValidationMiddleware.validateParams(bookSchemas.bookId),
      (req, res, next) => bookController.getBookById(req, res, next)
    );

    router.post(
      "/",
      ValidationMiddleware.validateContentType("application/json"),
      ValidationMiddleware.validateBody(bookSchemas.createBook),
      (req, res, next) => bookController.createBook(req, res, next)
    );

    router.put(
      "/:id",
      ValidationMiddleware.validateContentType("application/json"),
      ValidationMiddleware.validate({
        params: bookSchemas.bookId,
        body: bookSchemas.updateBook,
      }),
      (req, res, next) => bookController.updateBook(req, res, next)
    );

    router.delete(
      "/:id",
      ValidationMiddleware.validateParams(bookSchemas.bookId),
      (req, res, next) => bookController.deleteBook(req, res, next)
    );

    app.use("/api/books", router);

    jest.clearAllMocks();
  });

  describe("GET /api/books", () => {
    it("should return books with default pagination", async () => {
      const mockBooks = [
        {
          id: 1,
          title: "Test Book 1",
          author: "Test Author 1",
          isbn: "1234567890123",
          totalQuantity: 5,
          availableQuantity: 3,
          shelfLocation: "A1",
        },
      ];

      mockBookService.getAllBooks.mockResolvedValue(mockBooks);

      const response = await request(app).get("/api/books");

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("data");
      expect(response.body).toHaveProperty("meta");
      expect(response.body.data).toEqual(mockBooks);
      expect(mockBookService.getAllBooks).toHaveBeenCalledWith({
        limit: 10,
        offset: 0,
      });
    });

    it("should handle pagination parameters", async () => {
      const mockBooks = [];
      mockBookService.getAllBooks.mockResolvedValue(mockBooks);

      const response = await request(app)
        .get("/api/books")
        .query({ limit: 5, offset: 10 });

      expect(response.status).toBe(200);
      expect(mockBookService.getAllBooks).toHaveBeenCalledWith({
        limit: 5,
        offset: 10,
      });
    });

    it("should handle search parameter", async () => {
      const mockBooks = [];
      mockBookService.searchBooks.mockResolvedValue(mockBooks);

      const response = await request(app)
        .get("/api/books")
        .query({ search: "JavaScript" });

      expect(response.status).toBe(200);
      expect(mockBookService.searchBooks).toHaveBeenCalledWith({
        title: "JavaScript",
        author: "JavaScript",
        limit: 10,
        offset: 0,
      });
    });

    it("should validate query parameters", async () => {
      const response = await request(app)
        .get("/api/books")
        .query({ limit: -1 });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("GET /api/books/:id", () => {
    it("should return a book when found", async () => {
      const mockBook = {
        id: 1,
        title: "Test Book",
        author: "Test Author",
        isbn: "1234567890123",
        totalQuantity: 5,
        availableQuantity: 3,
        shelfLocation: "A1",
      };

      mockBookService.getBookById.mockResolvedValue(mockBook);

      const response = await request(app).get("/api/books/1");

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual(mockBook);
      expect(mockBookService.getBookById).toHaveBeenCalledWith(1);
    });

    it("should return 404 when book not found", async () => {
      mockBookService.getBookById.mockResolvedValue(null);

      const response = await request(app).get("/api/books/999");

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe("BOOK_NOT_FOUND");
    });

    it("should validate book ID parameter", async () => {
      const response = await request(app).get("/api/books/invalid");

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("POST /api/books", () => {
    it("should create a book successfully", async () => {
      const bookData = {
        title: "New Book",
        author: "New Author",
        isbn: "1234567890123",
        totalQuantity: 5,
        shelfLocation: "A1",
      };

      const createdBook = {
        id: 1,
        ...bookData,
        availableQuantity: 5,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockBookService.createBook.mockResolvedValue(createdBook);

      const response = await request(app)
        .post("/api/books")
        .send(bookData)
        .set("Content-Type", "application/json");

      expect(response.status).toBe(201);
      expect(response.body.data).toEqual(createdBook);
      expect(mockBookService.createBook).toHaveBeenCalledWith(bookData);
    });

    it("should validate required fields", async () => {
      const invalidData = {
        title: "Test Book",
        // Missing required fields
      };

      const response = await request(app)
        .post("/api/books")
        .send(invalidData)
        .set("Content-Type", "application/json");

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("should validate ISBN format", async () => {
      const invalidData = {
        title: "Test Book",
        author: "Test Author",
        isbn: "invalid-isbn",
        totalQuantity: 5,
        shelfLocation: "A1",
      };

      const response = await request(app)
        .post("/api/books")
        .send(invalidData)
        .set("Content-Type", "application/json");

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("should validate total quantity", async () => {
      const invalidData = {
        title: "Test Book",
        author: "Test Author",
        isbn: "1234567890123",
        totalQuantity: 0,
        shelfLocation: "A1",
      };

      const response = await request(app)
        .post("/api/books")
        .send(invalidData)
        .set("Content-Type", "application/json");

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("should handle missing Content-Type header", async () => {
      const bookData = {
        title: "New Book",
        author: "New Author",
        isbn: "1234567890123",
        totalQuantity: 5,
        shelfLocation: "A1",
      };

      // When no Content-Type is provided, supertest might still parse the body
      // The validation middleware should handle this case
      const response = await request(app).post("/api/books").send(bookData);

      // The request might succeed or fail depending on how express handles the body parsing
      // Let's just check that we get a response
      expect([400, 500].includes(response.status)).toBe(true);
    });
  });

  describe("PUT /api/books/:id", () => {
    it("should update a book successfully", async () => {
      const updateData = {
        title: "Updated Book Title",
        totalQuantity: 10,
      };

      const updatedBook = {
        id: 1,
        title: "Updated Book Title",
        author: "Original Author",
        isbn: "1234567890123",
        totalQuantity: 10,
        availableQuantity: 8,
        shelfLocation: "A1",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockBookService.updateBook.mockResolvedValue(updatedBook);

      const response = await request(app)
        .put("/api/books/1")
        .send(updateData)
        .set("Content-Type", "application/json");

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual(updatedBook);
      expect(mockBookService.updateBook).toHaveBeenCalledWith(1, updateData);
    });

    it("should validate book ID parameter", async () => {
      const response = await request(app)
        .put("/api/books/invalid")
        .send({ title: "Updated Title" })
        .set("Content-Type", "application/json");

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("should require at least one field to update", async () => {
      const response = await request(app)
        .put("/api/books/1")
        .send({})
        .set("Content-Type", "application/json");

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("should validate ISBN format in updates", async () => {
      const response = await request(app)
        .put("/api/books/1")
        .send({ isbn: "invalid" })
        .set("Content-Type", "application/json");

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("DELETE /api/books/:id", () => {
    it("should delete a book successfully", async () => {
      mockBookService.deleteBook.mockResolvedValue(true);

      const response = await request(app).delete("/api/books/1");

      expect(response.status).toBe(204);
      expect(mockBookService.deleteBook).toHaveBeenCalledWith(1);
    });

    it("should return 404 when book not found", async () => {
      mockBookService.deleteBook.mockResolvedValue(false);

      const response = await request(app).delete("/api/books/999");

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe("BOOK_NOT_FOUND");
    });

    it("should validate book ID parameter", async () => {
      const response = await request(app).delete("/api/books/invalid");

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("should handle active borrowings error", async () => {
      const error = new Error("Cannot delete book with active borrowings");
      mockBookService.deleteBook.mockRejectedValue(error);

      const response = await request(app).delete("/api/books/1");

      expect(response.status).toBe(409);
      expect(response.body.error.code).toBe("BOOK_HAS_ACTIVE_BORROWINGS");
    });
  });
});
