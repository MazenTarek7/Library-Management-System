# Postman Test Cases for Library Management System

## Authentication

For endpoints that require authentication, use Basic Auth:

- **Username**: `admin`
- **Password**: `admin`

## Test Data Setup

Before running the tests, you can set up test data using the database seeder:

```bash
npm run db:setup
```

### Seed Data Overview

The seeder creates the following test data:

**Books (5 books)**:

1. The Great Gatsby (F. Scott Fitzgerald) - ISBN: 9780743273565 - Available: 5/5
2. To Kill a Mockingbird (Harper Lee) - ISBN: 9780061120084 - Available: 2/3 (1 borrowed - overdue)
3. 1984 (George Orwell) - ISBN: 9780451524935 - Available: 4/4
4. Pride and Prejudice (Jane Austen) - ISBN: 9780141439518 - Available: 1/2 (1 borrowed - overdue)
5. The Catcher in the Rye (J.D. Salinger) - ISBN: 9780316769174 - Available: 2/3 (1 borrowed - active)

**Borrowers (4 borrowers)**:

1. John Doe (john.doe@email.com) - Registered: 2024-01-15
2. Jane Smith (jane.smith@email.com) - Registered: 2024-02-01
3. Bob Johnson (bob.johnson@email.com) - Registered: 2024-02-15
4. Alice Brown (alice.brown@email.com) - Registered: 2024-03-01

**Active Borrowings**:

- John Doe has "The Catcher in the Rye" (Active)
- John Doe has "Pride and Prejudice" (Overdue)
- Bob Johnson has "To Kill a Mockingbird" (Overdue)

**Returned Borrowings**:

- Jane Smith returned "The Great Gatsby" on time
- Alice Brown returned "1984" last month

---

## 1. Books Management

### 1.1 Create a Book (New Book)

**Method**: `POST`
**URL**: `/api/books`
**Headers**:

```
Content-Type: application/json
```

**Body** (JSON):

```json
{
  "title": "Moby Dick",
  "author": "Herman Melville",
  "isbn": "9780142437247",
  "totalQuantity": 3,
  "shelfLocation": "D1-050"
}
```

**Expected Response** (201 Created):

```json
{
  "success": true,
  "data": {
    "id": 6,
    "title": "Moby Dick",
    "author": "Herman Melville",
    "isbn": "9780142437247",
    "totalQuantity": 3,
    "availableQuantity": 3,
    "shelfLocation": "D1-050",
    "createdAt": "2024-01-15T10:30:45.123Z",
    "updatedAt": "2024-01-15T10:30:45.123Z"
  }
}
```

### 1.2 Get All Books (with Authentication)

**Method**: `GET`
**URL**: `/api/books`
**Auth**: Basic Auth (admin/admin)
**Query Parameters**:

```
limit=10
offset=0
```

**Expected Response** (200 OK):

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "The Great Gatsby",
      "author": "F. Scott Fitzgerald",
      "isbn": "9780743273565",
      "totalQuantity": 5,
      "availableQuantity": 5,
      "shelfLocation": "A1-001",
      "createdAt": "2024-01-15T10:30:45.123Z",
      "updatedAt": "2024-01-15T10:30:45.123Z"
    },
    {
      "id": 2,
      "title": "To Kill a Mockingbird",
      "author": "Harper Lee",
      "isbn": "9780061120084",
      "totalQuantity": 3,
      "availableQuantity": 2,
      "shelfLocation": "A1-002",
      "createdAt": "2024-01-15T10:30:45.123Z",
      "updatedAt": "2024-01-15T10:30:45.123Z"
    },
    {
      "id": 3,
      "title": "1984",
      "author": "George Orwell",
      "isbn": "9780451524935",
      "totalQuantity": 4,
      "availableQuantity": 4,
      "shelfLocation": "A2-001",
      "createdAt": "2024-01-15T10:30:45.123Z",
      "updatedAt": "2024-01-15T10:30:45.123Z"
    },
    {
      "id": 4,
      "title": "Pride and Prejudice",
      "author": "Jane Austen",
      "isbn": "9780141439518",
      "totalQuantity": 2,
      "availableQuantity": 1,
      "shelfLocation": "B1-001",
      "createdAt": "2024-01-15T10:30:45.123Z",
      "updatedAt": "2024-01-15T10:30:45.123Z"
    },
    {
      "id": 5,
      "title": "The Catcher in the Rye",
      "author": "J.D. Salinger",
      "isbn": "9780316769174",
      "totalQuantity": 3,
      "availableQuantity": 2,
      "shelfLocation": "B1-002",
      "createdAt": "2024-01-15T10:30:45.123Z",
      "updatedAt": "2024-01-15T10:30:45.123Z"
    }
  ],
  "meta": {
    "limit": 10,
    "offset": 0,
    "total": 5
  }
}
```

### 1.3 Get Book by ID (with Authentication)

**Method**: `GET`
**URL**: `/api/books/1`
**Auth**: Basic Auth (admin/admin)
**Expected Response** (200 OK):

```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "The Great Gatsby",
    "author": "F. Scott Fitzgerald",
    "isbn": "9780743273565",
    "totalQuantity": 5,
    "availableQuantity": 5,
    "shelfLocation": "A1-001",
    "createdAt": "2024-01-15T10:30:45.123Z",
    "updatedAt": "2024-01-15T10:30:45.123Z"
  }
}
```

### 1.4 Search Books by Title

**Method**: `GET`
**URL**: `/api/books?search=gatsby`
**Auth**: Basic Auth (admin/admin)
**Expected Response** (200 OK):

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "The Great Gatsby",
      "author": "F. Scott Fitzgerald",
      "isbn": "9780743273565",
      "totalQuantity": 5,
      "availableQuantity": 5,
      "shelfLocation": "A1-001",
      "createdAt": "2024-01-15T10:30:45.123Z",
      "updatedAt": "2024-01-15T10:30:45.123Z"
    }
  ],
  "meta": {
    "limit": 10,
    "offset": 0,
    "total": 1
  }
}
```

### 1.5 Search Books by Author

**Method**: `GET`
**URL**: `/api/books?search=orwell`
**Auth**: Basic Auth (admin/admin)
**Expected Response** (200 OK):

```json
{
  "success": true,
  "data": [
    {
      "id": 3,
      "title": "1984",
      "author": "George Orwell",
      "isbn": "9780451524935",
      "totalQuantity": 4,
      "availableQuantity": 4,
      "shelfLocation": "A2-001",
      "createdAt": "2024-01-15T10:30:45.123Z",
      "updatedAt": "2024-01-15T10:30:45.123Z"
    }
  ],
  "meta": {
    "limit": 10,
    "offset": 0,
    "total": 1
  }
}
```

### 1.6 Update a Book

**Method**: `PUT`
**URL**: `/api/books/2`
**Headers**:

```
Content-Type: application/json
```

**Body** (JSON):

```json
{
  "totalQuantity": 5,
  "shelfLocation": "A1-003"
}
```

**Expected Response** (200 OK):

```json
{
  "success": true,
  "data": {
    "id": 2,
    "title": "To Kill a Mockingbird",
    "author": "Harper Lee",
    "isbn": "9780061120084",
    "totalQuantity": 5,
    "availableQuantity": 4,
    "shelfLocation": "A1-003",
    "createdAt": "2024-01-15T10:30:45.123Z",
    "updatedAt": "2024-01-15T10:35:22.456Z"
  }
}
```

**Note**: `availableQuantity` is 4 (not 5) because there is 1 active borrowing for this book in the seed data. The system correctly calculates: `availableQuantity = totalQuantity - activeBorrowings = 5 - 1 = 4`

### 1.7 Delete a Book

**Method**: `DELETE`
**URL**: `/api/books/6`
**Note**: Use the ID of the book created in test 1.1 (Moby Dick)
**Expected Response** (204 No Content): Empty body

### 1.8 Test Rate Limiting

**Method**: `GET`
**URL**: `/api/books`
**Auth**: Basic Auth (admin/admin)
**Instructions**: Make 11 requests quickly to trigger rate limiting
**Expected Response** (429 Too Many Requests) on 11th request:

```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests from this IP, please try again later."
  }
}
```

---

## 2. Borrowers Management

### 2.1 Register a Borrower (New Borrower - Not in Seed Data)

**Method**: `POST`
**URL**: `/api/borrowers`
**Headers**:

```
Content-Type: application/json
```

**Body** (JSON):

```json
{
  "name": "Michael Wilson",
  "email": "michael.wilson@email.com"
}
```

**Expected Response** (201 Created):

```json
{
  "success": true,
  "data": {
    "id": 5,
    "name": "Michael Wilson",
    "email": "michael.wilson@email.com",
    "registeredDate": "2024-01-15",
    "createdAt": "2024-01-15T10:30:45.123Z",
    "updatedAt": "2024-01-15T10:30:45.123Z"
  }
}
```

### 2.2 Get All Borrowers

**Method**: `GET`
**URL**: `/api/borrowers`
**Query Parameters** (optional):

```
limit=10
offset=0
```

**Expected Response** (200 OK):

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john.doe@email.com",
      "registeredDate": "2024-01-15",
      "createdAt": "2024-01-15T10:30:45.123Z",
      "updatedAt": "2024-01-15T10:30:45.123Z"
    },
    {
      "id": 2,
      "name": "Jane Smith",
      "email": "jane.smith@email.com",
      "registeredDate": "2024-02-01",
      "createdAt": "2024-01-15T10:30:45.123Z",
      "updatedAt": "2024-01-15T10:30:45.123Z"
    },
    {
      "id": 3,
      "name": "Bob Johnson",
      "email": "bob.johnson@email.com",
      "registeredDate": "2024-02-15",
      "createdAt": "2024-01-15T10:30:45.123Z",
      "updatedAt": "2024-01-15T10:30:45.123Z"
    },
    {
      "id": 4,
      "name": "Alice Brown",
      "email": "alice.brown@email.com",
      "registeredDate": "2024-03-01",
      "createdAt": "2024-01-15T10:30:45.123Z",
      "updatedAt": "2024-01-15T10:30:45.123Z"
    }
  ],
  "meta": {
    "limit": 10,
    "offset": 0,
    "total": 4
  }
}
```

### 2.3 Get Borrower by ID

**Method**: `GET`
**URL**: `/api/borrowers/1`
**Expected Response** (200 OK):

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "John Doe",
    "email": "john.doe@email.com",
    "registeredDate": "2024-01-15",
    "createdAt": "2024-01-15T10:30:45.123Z",
    "updatedAt": "2024-01-15T10:30:45.123Z"
  }
}
```

### 2.4 Update Borrower

**Method**: `PUT`
**URL**: `/api/borrowers/4`
**Headers**:

```
Content-Type: application/json
```

**Body** (JSON):

```json
{
  "name": "Alice Brown-Smith",
  "email": "alice.brownsmith@email.com"
}
```

**Expected Response** (200 OK):

```json
{
  "success": true,
  "data": {
    "id": 4,
    "name": "Alice Brown-Smith",
    "email": "alice.brownsmith@email.com",
    "registeredDate": "2024-03-01",
    "createdAt": "2024-01-15T10:30:45.123Z",
    "updatedAt": "2024-01-15T10:35:22.456Z"
  }
}
```

### 2.5 Delete Borrower

**Method**: `DELETE`
**URL**: `/api/borrowers/5`
**Note**: Use the ID of the borrower created in test 2.1 (Michael Wilson)
**Expected Response** (204 No Content): Empty body

---

## 3. Borrowing Process

### 3.1 Check Out a Book (Available Book)

**Method**: `POST`
**URL**: `/api/borrowings/checkout`
**Headers**:

```
Content-Type: application/json
```

**Body** (JSON):

```json
{
  "borrowerId": 2,
  "bookId": 3
}
```

**Expected Response** (201 Created):

```json
{
  "success": true,
  "data": {
    "id": 6,
    "borrowerId": 2,
    "bookId": 3,
    "checkoutDate": "2024-01-15",
    "dueDate": "2024-01-29",
    "returnDate": null,
    "createdAt": "2024-01-15T10:30:45.123Z",
    "updatedAt": "2024-01-15T10:30:45.123Z",
    "book": {
      "id": 3,
      "title": "1984",
      "author": "George Orwell",
      "isbn": "9780451524935"
    },
    "borrower": {
      "id": 2,
      "name": "Jane Smith",
      "email": "jane.smith@email.com"
    }
  }
}
```

### 3.2 Return a Book

**Method**: `PUT`
**URL**: `/api/borrowings/6/return`
**Note**: Use the ID of the borrowing created in test 3.1
**Expected Response** (200 OK):

```json
{
  "success": true,
  "data": {
    "id": 6,
    "borrowerId": 2,
    "bookId": 3,
    "checkoutDate": "2024-01-15",
    "dueDate": "2024-01-29",
    "returnDate": "2024-01-20",
    "createdAt": "2024-01-15T10:30:45.123Z",
    "updatedAt": "2024-01-20T14:22:33.789Z",
    "book": {
      "id": 3,
      "title": "1984",
      "author": "George Orwell",
      "isbn": "9780451524935"
    },
    "borrower": {
      "id": 2,
      "name": "Jane Smith",
      "email": "jane.smith@email.com"
    }
  }
}
```

### 3.3 Get Borrower's Current Books (Active Borrowings from Seed Data)

**Method**: `GET`
**URL**: `/api/borrowers/1/current-books`
**Expected Response** (200 OK):

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "borrowerId": 1,
      "bookId": 5,
      "checkoutDate": "2024-01-01",
      "dueDate": "2024-01-15",
      "returnDate": null,
      "createdAt": "2024-01-15T10:30:45.123Z",
      "updatedAt": "2024-01-15T10:30:45.123Z",
      "book": {
        "id": 5,
        "title": "The Catcher in the Rye",
        "author": "J.D. Salinger",
        "isbn": "9780316769174"
      }
    },
    {
      "id": 5,
      "borrowerId": 1,
      "bookId": 4,
      "checkoutDate": "2024-01-02",
      "dueDate": "2024-01-10",
      "returnDate": null,
      "createdAt": "2024-01-15T10:30:45.123Z",
      "updatedAt": "2024-01-15T10:30:45.123Z",
      "book": {
        "id": 4,
        "title": "Pride and Prejudice",
        "author": "Jane Austen",
        "isbn": "9780141439518"
      }
    }
  ]
}
```

### 3.4 Get Overdue Books (From Seed Data)

**Method**: `GET`
**URL**: `/api/borrowings/overdue`
**Query Parameters** (optional):

```
limit=10
offset=0
```

**Expected Response** (200 OK):

```json
{
  "success": true,
  "data": [
    {
      "id": 3,
      "borrowerId": 3,
      "bookId": 2,
      "checkoutDate": "2024-01-01",
      "dueDate": "2024-01-10",
      "returnDate": null,
      "daysOverdue": 5,
      "createdAt": "2024-01-01T10:30:45.123Z",
      "updatedAt": "2024-01-01T10:30:45.123Z",
      "book": {
        "id": 2,
        "title": "To Kill a Mockingbird",
        "author": "Harper Lee",
        "isbn": "9780061120084"
      },
      "borrower": {
        "id": 3,
        "name": "Bob Johnson",
        "email": "bob.johnson@email.com"
      }
    },
    {
      "id": 5,
      "borrowerId": 1,
      "bookId": 4,
      "checkoutDate": "2024-01-02",
      "dueDate": "2024-01-10",
      "returnDate": null,
      "daysOverdue": 5,
      "createdAt": "2024-01-01T10:30:45.123Z",
      "updatedAt": "2024-01-01T10:30:45.123Z",
      "book": {
        "id": 4,
        "title": "Pride and Prejudice",
        "author": "Jane Austen",
        "isbn": "9780141439518"
      },
      "borrower": {
        "id": 1,
        "name": "John Doe",
        "email": "john.doe@email.com"
      }
    }
  ],
  "meta": {
    "limit": 10,
    "offset": 0,
    "total": 2
  }
}
```

---

## 4. CSV Export Features

### 4.1 Export Last Month's Borrowings

**Method**: `GET`
**URL**: `/api/borrowings/exports/last-month`
**Expected Response** (200 OK):
**Headers**:

```
Content-Type: text/csv
Content-Disposition: attachment; filename="borrowings-last-month.csv"
```

**Body** (CSV format):

```csv
id,borrowerId,bookId,checkoutDate,dueDate,returnDate,borrowerName,borrowerEmail,bookTitle,bookAuthor,bookIsbn
1,1,1,2024-01-15,2024-01-29,2024-01-20,John Doe,john.doe@email.com,The Great Gatsby,F. Scott Fitzgerald,9780743273565
```

### 4.2 Export Last Month's Overdue Borrowings

**Method**: `GET`
**URL**: `/api/borrowings/exports/overdue-last-month`
**Expected Response** (200 OK):
**Headers**:

```
Content-Type: text/csv
Content-Disposition: attachment; filename="overdue-borrowings-last-month.csv"
```

**Body** (CSV format):

```csv
id,borrowerId,bookId,checkoutDate,dueDate,returnDate,daysOverdue,borrowerName,borrowerEmail,bookTitle,bookAuthor,bookIsbn
3,2,3,2024-01-01,2024-01-10,,5,Jane Smith,jane.smith@email.com,1984,George Orwell,9780451524935
```

---

## 5. Health Check

### 5.1 Application Health Status

**Method**: `GET`
**URL**: `/health`
**Expected Response** (200 OK):

```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:45.123Z",
  "environment": "development",
  "version": "1.0.0"
}
```

---

## 6. Error Cases Testing

### 6.1 Book Not Found

**Method**: `GET`
**URL**: `/api/books/999`
**Auth**: Basic Auth (admin/admin)
**Expected Response** (404 Not Found):

```json
{
  "error": {
    "code": "BOOK_NOT_FOUND",
    "message": "Book with ID 999 not found"
  }
}
```

### 6.2 Duplicate ISBN (Using Existing Seed Data ISBN)

**Method**: `POST`
**URL**: `/api/books`
**Headers**:

```
Content-Type: application/json
```

**Body** (JSON):

```json
{
  "title": "Another Great Gatsby",
  "author": "Another Author",
  "isbn": "9780743273565",
  "totalQuantity": 3,
  "shelfLocation": "B1-001"
}
```

**Expected Response** (400 Bad Request):

```json
{
  "error": {
    "code": "DUPLICATE_ISBN",
    "message": "A book with this isbn already exists"
  }
}
```

### 6.3 Invalid Email Format

**Method**: `POST`
**URL**: `/api/borrowers`
**Headers**:

```
Content-Type: application/json
```

**Body** (JSON):

```json
{
  "name": "Invalid User",
  "email": "invalid-email"
}
```

**Expected Response** (400 Bad Request):

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "email",
        "message": "\"email\" must be a valid email"
      }
    ]
  }
}
```

### 6.4 Book Not Available for Checkout (Using Book with No Available Copies)

**Method**: `POST`
**URL**: `/api/borrowings/checkout`
**Headers**:

```
Content-Type: application/json
```

**Body** (JSON):

```json
{
  "borrowerId": 2,
  "bookId": 5
}
```

**Note**: Book ID 5 (The Catcher in the Rye) has availableQuantity = 2 but totalQuantity = 3, meaning 1 copy is already borrowed
**Expected Response** (400 Bad Request):

```json
{
  "error": {
    "code": "BOOK_NOT_AVAILABLE",
    "message": "Book 'The Catcher in the Rye' is not available for checkout"
  }
}
```

### 6.5 Authentication Required

**Method**: `GET`
**URL**: `/api/books`
**Expected Response** (401 Unauthorized):

```json
{
  "error": {
    "code": "AUTHENTICATION_REQUIRED",
    "message": "Authentication required. Please provide valid credentials."
  }
}
```

### 6.6 Invalid Credentials

**Method**: `GET`
**URL**: `/api/books`
**Auth**: Basic Auth (wrong/credentials)
**Expected Response** (401 Unauthorized):

```json
{
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid username or password."
  }
}
```

---

## 7. Validation Testing

### 7.1 Missing Required Fields

**Method**: `POST`
**URL**: `/api/books`
**Headers**:

```
Content-Type: application/json
```

**Body** (JSON):

```json
{
  "title": "Incomplete Book"
}
```

**Expected Response** (400 Bad Request):

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "author",
        "message": "\"author\" is required"
      },
      {
        "field": "isbn",
        "message": "\"isbn\" is required"
      },
      {
        "field": "totalQuantity",
        "message": "\"totalQuantity\" is required"
      },
      {
        "field": "shelfLocation",
        "message": "\"shelfLocation\" is required"
      }
    ]
  }
}
```

### 7.2 Invalid ISBN Format

**Method**: `POST`
**URL**: `/api/books`
**Headers**:

```
Content-Type: application/json
```

**Body** (JSON):

```json
{
  "title": "Test Book",
  "author": "Test Author",
  "isbn": "123",
  "totalQuantity": 5,
  "shelfLocation": "A1-001"
}
```

**Expected Response** (400 Bad Request):

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "isbn",
        "message": "\"isbn\" length must be 13 characters long"
      }
    ]
  }
}
```

---

## Test Sequence Recommendation

1. **Setup**: Run database setup to create initial data
2. **Authentication**: Test authentication endpoints first
3. **Books**: Test all book CRUD operations
4. **Borrowers**: Test all borrower CRUD operations
5. **Borrowing**: Test checkout/return flow
6. **Reports**: Test CSV export functionality
7. **Error Cases**: Test various error scenarios
8. **Rate Limiting**: Test rate limiting behavior

## Notes

- Replace `localhost:3000` with your actual server URL
- Ensure the database is running and seeded before testing
- Some tests depend on data created by previous tests
- Rate limiting tests should be run separately to avoid affecting other tests
- CSV export tests will download files - check your browser's download folder
