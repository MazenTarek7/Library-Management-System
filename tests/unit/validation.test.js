const { validation } = require("../../src/models");
const {
  bookSchemas,
  borrowerSchemas,
  borrowingSchemas,
  responseSchemas,
  querySchemas,
  validationHelpers,
  commonPatterns,
} = validation;

describe("Validation Schemas", () => {
  describe("Book Validation", () => {
    describe("createBook schema", () => {
      const validBookData = {
        title: "Test Book",
        author: "Test Author",
        isbn: "1234567890123",
        totalQuantity: 5,
        shelfLocation: "A1-B2",
      };

      it("should validate correct book data", () => {
        const { error, value } = bookSchemas.createBook.validate(validBookData);

        expect(error).toBeUndefined();
        expect(value).toEqual(validBookData);
      });

      it("should require all fields", () => {
        const requiredFields = [
          "title",
          "author",
          "isbn",
          "totalQuantity",
          "shelfLocation",
        ];

        requiredFields.forEach((field) => {
          const incompleteData = { ...validBookData };
          delete incompleteData[field];

          const { error } = bookSchemas.createBook.validate(incompleteData);
          expect(error).toBeDefined();
          expect(error.details[0].path).toContain(field);
        });
      });

      it("should validate ISBN format (13 digits)", () => {
        const invalidISBNs = [
          "123",
          "12345678901234",
          "abcd567890123",
          "123-456-789-012",
        ];

        invalidISBNs.forEach((isbn) => {
          const invalidData = { ...validBookData, isbn };
          const { error } = bookSchemas.createBook.validate(invalidData);

          expect(error).toBeDefined();
          expect(error.details[0].path).toContain("isbn");
        });
      });

      it("should require positive totalQuantity", () => {
        const invalidQuantities = [0, -1, -10];

        invalidQuantities.forEach((totalQuantity) => {
          const invalidData = { ...validBookData, totalQuantity };
          const { error } = bookSchemas.createBook.validate(invalidData);

          expect(error).toBeDefined();
          expect(error.details[0].path).toContain("totalQuantity");
        });
      });

      it("should trim and validate string fields", () => {
        const dataWithWhitespace = {
          ...validBookData,
          title: "  Test Book  ",
          author: "  Test Author  ",
          shelfLocation: "  A1-B2  ",
        };

        const { error, value } =
          bookSchemas.createBook.validate(dataWithWhitespace);

        expect(error).toBeUndefined();
        expect(value.title).toBe("Test Book");
        expect(value.author).toBe("Test Author");
        expect(value.shelfLocation).toBe("A1-B2");
      });

      it("should reject empty strings", () => {
        const emptyStringFields = ["title", "author", "shelfLocation"];

        emptyStringFields.forEach((field) => {
          const invalidData = { ...validBookData, [field]: "" };
          const { error } = bookSchemas.createBook.validate(invalidData);

          expect(error).toBeDefined();
          expect(error.details[0].path).toContain(field);
        });
      });
    });

    describe("updateBook schema", () => {
      it("should validate partial updates", () => {
        const partialData = { title: "Updated Title" };
        const { error, value } = bookSchemas.updateBook.validate(partialData);

        expect(error).toBeUndefined();
        expect(value).toEqual(partialData);
      });

      it("should require at least one field", () => {
        const { error } = bookSchemas.updateBook.validate({});

        expect(error).toBeDefined();
        expect(error.details[0].message).toContain("at least");
      });

      it("should validate ISBN format when provided", () => {
        const invalidData = { isbn: "123" };
        const { error } = bookSchemas.updateBook.validate(invalidData);

        expect(error).toBeDefined();
        expect(error.details[0].path).toContain("isbn");
      });
    });

    describe("searchBooks schema", () => {
      it("should validate search criteria", () => {
        const searchData = {
          title: "Test",
          author: "Author",
          isbn: "1234567890123",
          limit: 20,
          offset: 10,
        };

        const { error, value } = bookSchemas.searchBooks.validate(searchData);

        expect(error).toBeUndefined();
        expect(value).toEqual(searchData);
      });

      it("should apply default pagination values", () => {
        const { error, value } = bookSchemas.searchBooks.validate({});

        expect(error).toBeUndefined();
        expect(value.limit).toBe(10);
        expect(value.offset).toBe(0);
      });

      it("should validate limit range", () => {
        const invalidLimits = [0, -1, 101];

        invalidLimits.forEach((limit) => {
          const { error } = bookSchemas.searchBooks.validate({ limit });
          expect(error).toBeDefined();
        });
      });
    });

    describe("bookId schema", () => {
      it("should validate positive integer ID", () => {
        const { error, value } = bookSchemas.bookId.validate({ id: 123 });

        expect(error).toBeUndefined();
        expect(value.id).toBe(123);
      });

      it("should reject invalid IDs", () => {
        const invalidIds = [0, -1, "abc", 1.5];

        invalidIds.forEach((id) => {
          const { error } = bookSchemas.bookId.validate({ id });
          expect(error).toBeDefined();
        });
      });
    });
  });

  describe("Borrower Validation", () => {
    describe("createBorrower schema", () => {
      const validBorrowerData = {
        name: "John Doe",
        email: "john.doe@example.com",
      };

      it("should validate correct borrower data", () => {
        const { error, value } =
          borrowerSchemas.createBorrower.validate(validBorrowerData);

        expect(error).toBeUndefined();
        expect(value).toEqual(validBorrowerData);
      });

      it("should require name and email", () => {
        const { error: nameError } = borrowerSchemas.createBorrower.validate({
          email: "test@example.com",
        });
        const { error: emailError } = borrowerSchemas.createBorrower.validate({
          name: "John Doe",
        });

        expect(nameError).toBeDefined();
        expect(emailError).toBeDefined();
      });

      it("should validate email format", () => {
        const invalidEmails = [
          "invalid-email",
          "@example.com",
          "user@",
          "user@.com",
        ];

        invalidEmails.forEach((email) => {
          const invalidData = { ...validBorrowerData, email };
          const { error } =
            borrowerSchemas.createBorrower.validate(invalidData);

          expect(error).toBeDefined();
          expect(error.details[0].path).toContain("email");
        });
      });

      it("should trim whitespace from name", () => {
        const dataWithWhitespace = {
          name: "  John Doe  ",
          email: "john.doe@example.com",
        };

        const { error, value } =
          borrowerSchemas.createBorrower.validate(dataWithWhitespace);

        expect(error).toBeUndefined();
        expect(value.name).toBe("John Doe");
      });

      it("should reject empty name", () => {
        const invalidData = { ...validBorrowerData, name: "" };
        const { error } = borrowerSchemas.createBorrower.validate(invalidData);

        expect(error).toBeDefined();
        expect(error.details[0].path).toContain("name");
      });
    });

    describe("updateBorrower schema", () => {
      it("should validate partial updates", () => {
        const partialData = { name: "Jane Doe" };
        const { error, value } =
          borrowerSchemas.updateBorrower.validate(partialData);

        expect(error).toBeUndefined();
        expect(value).toEqual(partialData);
      });

      it("should require at least one field", () => {
        const { error } = borrowerSchemas.updateBorrower.validate({});

        expect(error).toBeDefined();
        expect(error.details[0].message).toContain("at least");
      });
    });
  });

  describe("Borrowing Validation", () => {
    describe("checkout schema", () => {
      const validCheckoutData = {
        borrowerId: 1,
        bookId: 2,
      };

      it("should validate correct checkout data", () => {
        const { error, value } =
          borrowingSchemas.checkout.validate(validCheckoutData);

        expect(error).toBeUndefined();
        expect(value).toEqual(validCheckoutData);
      });

      it("should require borrowerId and bookId", () => {
        const { error: borrowerError } = borrowingSchemas.checkout.validate({
          bookId: 1,
        });
        const { error: bookError } = borrowingSchemas.checkout.validate({
          borrowerId: 1,
        });

        expect(borrowerError).toBeDefined();
        expect(bookError).toBeDefined();
      });

      it("should validate positive integer IDs", () => {
        const invalidIds = [0, -1, "abc", 1.5];

        invalidIds.forEach((id) => {
          const invalidBorrowerData = { borrowerId: id, bookId: 1 };
          const invalidBookData = { borrowerId: 1, bookId: id };

          const { error: borrowerError } =
            borrowingSchemas.checkout.validate(invalidBorrowerData);
          const { error: bookError } =
            borrowingSchemas.checkout.validate(invalidBookData);

          expect(borrowerError).toBeDefined();
          expect(bookError).toBeDefined();
        });
      });
    });

    describe("returnBook schema", () => {
      it("should validate borrowing ID", () => {
        const { error, value } = borrowingSchemas.returnBook.validate({
          id: 123,
        });

        expect(error).toBeUndefined();
        expect(value.id).toBe(123);
      });

      it("should reject invalid IDs", () => {
        const invalidIds = [0, -1, "abc", 1.5];

        invalidIds.forEach((id) => {
          const { error } = borrowingSchemas.returnBook.validate({ id });
          expect(error).toBeDefined();
        });
      });
    });
  });

  describe("Response Schemas", () => {
    describe("paginatedResponse", () => {
      it("should validate paginated book response", () => {
        const paginatedBooks = responseSchemas.paginatedResponse(
          bookSchemas.bookResponse
        );

        const validResponse = {
          data: [
            {
              id: 1,
              title: "Test Book",
              author: "Test Author",
              isbn: "1234567890123",
              totalQuantity: 5,
              availableQuantity: 3,
              shelfLocation: "A1-B2",
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
          meta: {
            total: 1,
            limit: 10,
            offset: 0,
            hasNext: false,
            hasPrevious: false,
          },
        };

        const { error } = paginatedBooks.validate(validResponse);
        expect(error).toBeUndefined();
      });
    });

    describe("errorResponse", () => {
      it("should validate error response format", () => {
        const validError = {
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid input data",
            details: [
              {
                field: "email",
                message: "Invalid email format",
              },
            ],
          },
        };

        const { error } = responseSchemas.errorResponse.validate(validError);
        expect(error).toBeUndefined();
      });

      it("should allow error response without details", () => {
        const validError = {
          error: {
            code: "NOT_FOUND",
            message: "Resource not found",
          },
        };

        const { error } = responseSchemas.errorResponse.validate(validError);
        expect(error).toBeUndefined();
      });
    });
  });

  describe("Query Schemas", () => {
    describe("pagination", () => {
      it("should apply default values", () => {
        const { error, value } = querySchemas.pagination.validate({});

        expect(error).toBeUndefined();
        expect(value.limit).toBe(10);
        expect(value.offset).toBe(0);
      });

      it("should validate limit range", () => {
        const { error: minError } = querySchemas.pagination.validate({
          limit: 0,
        });
        const { error: maxError } = querySchemas.pagination.validate({
          limit: 101,
        });

        expect(minError).toBeDefined();
        expect(maxError).toBeDefined();
      });

      it("should validate offset minimum", () => {
        const { error } = querySchemas.pagination.validate({ offset: -1 });
        expect(error).toBeDefined();
      });
    });

    describe("bookListing", () => {
      it("should validate book listing query parameters", () => {
        const validQuery = {
          limit: 20,
          offset: 10,
          search: "test book",
        };

        const { error, value } = querySchemas.bookListing.validate(validQuery);

        expect(error).toBeUndefined();
        expect(value).toEqual(validQuery);
      });

      it("should allow optional search parameter", () => {
        const { error, value } = querySchemas.bookListing.validate({
          limit: 10,
        });

        expect(error).toBeUndefined();
        expect(value.search).toBeUndefined();
      });
    });
  });

  describe("Validation Helpers", () => {
    describe("validateBody", () => {
      it("should validate request body and strip unknown fields", () => {
        const data = {
          title: "Test Book",
          author: "Test Author",
          isbn: "1234567890123",
          totalQuantity: 5,
          shelfLocation: "A1-B2",
          unknownField: "should be stripped",
        };

        const { error, value } = validationHelpers.validateBody(
          data,
          bookSchemas.createBook
        );

        expect(error).toBeUndefined();
        expect(value.unknownField).toBeUndefined();
        expect(value.title).toBe("Test Book");
      });

      it("should return all validation errors", () => {
        const invalidData = {
          title: "",
          isbn: "123",
          totalQuantity: -1,
        };

        const { error } = validationHelpers.validateBody(
          invalidData,
          bookSchemas.createBook
        );

        expect(error).toBeDefined();
        expect(error.details.length).toBeGreaterThan(1);
      });
    });

    describe("validateQuery", () => {
      it("should validate query parameters", () => {
        const query = { limit: "20", offset: "10" };
        const { error, value } = validationHelpers.validateQuery(
          query,
          querySchemas.pagination
        );

        expect(error).toBeUndefined();
        expect(value.limit).toBe(20); // Should be converted to number
        expect(value.offset).toBe(10);
      });
    });

    describe("validateParams", () => {
      it("should validate path parameters", () => {
        const params = { id: "123" };
        const { error, value } = validationHelpers.validateParams(
          params,
          bookSchemas.bookId
        );

        expect(error).toBeUndefined();
        expect(value.id).toBe(123); // Should be converted to number
      });
    });

    describe("formatValidationError", () => {
      it("should format Joi validation errors for API response", () => {
        const invalidData = { title: "", isbn: "123" };
        const { error } = bookSchemas.createBook.validate(invalidData);

        const formattedError = validationHelpers.formatValidationError(error);

        expect(formattedError.error.code).toBe("VALIDATION_ERROR");
        expect(formattedError.error.message).toBe("Invalid input data");
        expect(formattedError.error.details).toBeInstanceOf(Array);
        expect(formattedError.error.details.length).toBeGreaterThan(0);

        formattedError.error.details.forEach((detail) => {
          expect(detail).toHaveProperty("field");
          expect(detail).toHaveProperty("message");
        });
      });
    });
  });

  describe("Common Patterns", () => {
    describe("id pattern", () => {
      it("should validate positive integers", () => {
        const { error: validError } = commonPatterns.id.validate(123);
        expect(validError).toBeUndefined();

        const invalidValues = [0, -1, 1.5, "abc"];
        invalidValues.forEach((value) => {
          const { error } = commonPatterns.id.validate(value);
          expect(error).toBeDefined();
        });
      });
    });

    describe("email pattern", () => {
      it("should validate email addresses", () => {
        const validEmails = ["test@example.com", "user.name@domain.co.uk"];
        validEmails.forEach((email) => {
          const { error } = commonPatterns.email.validate(email);
          expect(error).toBeUndefined();
        });

        const invalidEmails = ["invalid", "@example.com", "user@"];
        invalidEmails.forEach((email) => {
          const { error } = commonPatterns.email.validate(email);
          expect(error).toBeDefined();
        });
      });
    });

    describe("isbn pattern", () => {
      it("should validate 13-digit ISBN", () => {
        const { error } = commonPatterns.isbn.validate("1234567890123");
        expect(error).toBeUndefined();

        const invalidISBNs = ["123", "12345678901234", "abcd567890123"];
        invalidISBNs.forEach((isbn) => {
          const { error } = commonPatterns.isbn.validate(isbn);
          expect(error).toBeDefined();
        });
      });
    });
  });
});
