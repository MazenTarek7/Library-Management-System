# API Documentation

This document provides detailed information about the Library Management System API endpoints, including request/response examples and error handling.

## Base URL

- **Development**: `http://localhost:3000`

## Response Format

All API responses follow a consistent format:

**Success Response:**

```json
{
  "data": { ... }
}
```

**Error Response:**

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description",
    [Optional]"path": "/api/endpoint"
  }
}
```

## Books Endpoints

### Get All Books

**GET** `/api/books`

Retrieve a list of all books in the library.

**Query Parameters:**

- `limit` (optional): Number of items per page (default: 10)
- `offset` (optional): Number of items to skip (default: 0)
- `search` (optional): Search term for title or author
- `available` (optional): Filter by availability (true/false)

**Response:**

```json
{
  "data": [
    {
      "id": 1,
      "title": "The Great Gatsby",
      "author": "F. Scott Fitzgerald",
      "isbn": "9780743273565",
      "totalQuantity": 5,
      "availableQuantity": 5,
      "shelfLocation": "A1-001",
      "createdAt": "2025-08-27T21:49:06.395Z",
      "updatedAt": "2025-08-27T21:49:06.395Z"
    }
  ],
  "meta": {
    "total": 25,
    "limit": 10,
    "offset": 0,
    "hasNext": true,
    "hasPrevious": false
  }
}
```

### Get Book by ID

**GET** `/api/books/:id`

Retrieve a specific book by its ID.

**Response:**

```json
{
  "data": {
    "id": 1,
    "title": "The Great Gatsby",
    "author": "F. Scott Fitzgerald",
    "isbn": "9780743273565",
    "totalQuantity": 5,
    "availableQuantity": 5,
    "shelfLocation": "A1-001",
    "createdAt": "2025-08-27T21:49:06.395Z",
    "updatedAt": "2025-08-27T21:49:06.395Z"
  }
}
```

### Create Book

**POST** `/api/books`

Add a new book to the library.

**Request Body:**

```json
{
  "title": "To Kill a Mockingbird",
  "author": "Harper Lee",
  "isbn": "9780446310789",
  "totalQuantity": 3,
  "shelfLocation": "Fiction-B2"
}
```

**Response:**

```json
{
  "data": {
    "id": 2,
    "title": "To Kill a Mockingbird",
    "author": "Harper Lee",
    "isbn": "9780446310789",
    "totalQuantity": 3,
    "availableQuantity": 3,
    "shelfLocation": "A1-002",
    "createdAt": "2025-08-27T21:49:06.400Z",
    "updatedAt": "2025-08-27T21:49:06.400Z"
  }
}
```

### Update Book

**PUT** `/api/books/:id`

Update an existing book's information.

**Request Body:**

```json
{
  "title": "To Kill a Mockingbird (Updated)",
  "totalQuantity": 5,
  "shelfLocation": "Fiction-B3"
}
```

**Response:**

```json
{
  "data": {
    "id": 2,
    "title": "To Kill a Mockingbird (Updated)",
    "author": "Harper Lee",
    "isbn": "9780446310789",
    "totalQuantity": 5,
    "availableQuantity": 3,
    "shelfLocation": "A1-003",
    "createdAt": "2025-08-27T21:49:06.400Z",
    "updatedAt": "2025-08-27T21:49:06.401Z"
  }
}
```

### Delete Book

**DELETE** `/api/books/:id`

Remove a book from the library.

**Response:**

```json
{
  "data": null
}
```

## Borrowers Endpoints

### Get All Borrowers

**GET** `/api/borrowers`

Retrieve a list of all registered borrowers.

**Query Parameters:**

- `limit` (optional): Number of items per page (default: 10)
- `offset` (optional): Number of items to skip (default: 0)
- `search` (optional): Search term for name or email

**Response:**

```json
{
  "data": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john.doe@email.com",
      "registeredDate": "2024-01-15T00:00:00.000Z",
      "createdAt": "2025-08-27T21:49:06.405Z",
      "updatedAt": "2025-08-27T21:49:06.405Z"
    }
  ],
  "meta": {
    "total": 15,
    "limit": 10,
    "offset": 0,
    "hasNext": true,
    "hasPrevious": false
  }
}
```

### Get Borrower by ID

**GET** `/api/borrowers/:id`

Retrieve a specific borrower by their ID.

**Response:**

```json
{
  "data": {
    "id": 1,
    "name": "John Doe",
    "email": "john.doe@email.com",
    "registeredDate": "2024-01-15T00:00:00.000Z",
    "createdAt": "2025-08-27T21:49:06.405Z",
    "updatedAt": "2025-08-27T21:49:06.405Z"
  }
}
```

### Register Borrower

**POST** `/api/borrowers`

Register a new borrower.

**Request Body:**

```json
{
  "name": "Jane Smith",
  "email": "jane.smith@example.com"
}
```

**Response:**

```json
{
  "data": {
    "id": 2,
    "name": "Jane Smith",
    "email": "jane.smith@example.com",
    "registeredDate": "2024-01-15T00:00:00.000Z",
    "createdAt": "2025-08-27T21:49:06.407Z",
    "updatedAt": "2025-08-27T21:49:06.407Z"
  }
}
```

### Update Borrower

**PUT** `/api/borrowers/:id`

Update an existing borrower's information.

**Request Body:**

```json
{
  "name": "Jane Smith (Updated)",
  "email": "jane.smith.updated@example.com"
}
```

**Response:**

```json
{
  "data": {
    "id": 2,
    "name": "Jane Smith (Updated)",
    "email": "jane.smith.updated@example.com",
    "registeredDate": "2024-01-15T00:00:00.000Z",
    "createdAt": "2025-08-27T21:49:06.407Z",
    "updatedAt": "2025-08-27T21:49:06.408Z"
  }
}
```

### Delete Borrower

**DELETE** `/api/borrowers/:id`

Remove a borrower from the system.

**Response:**

```json
{
  "data": null
}
```

## Borrowings Endpoints

### Check Out Book

**POST** `/api/borrowings/checkout`

Check out a book for a borrower.

**Request Body:**

```json
{
  "borrowerId": 1,
  "bookId": 1,
  "dueDate": "2024-02-15"
}
```

**Response:**

```json
{
  "data": {
    "id": 1,
    "borrowerId": 1,
    "bookId": 1,
    "checkoutDate": "2024-01-15",
    "dueDate": "2024-02-15",
    "returnDate": null,
    "createdAt": "2024-01-15T13:00:00Z",
    "updatedAt": "2024-01-15T13:00:00Z",
    "borrower": {
      "id": 1,
      "name": "John Doe",
      "email": "john.doe@example.com"
    },
    "book": {
      "id": 1,
      "title": "The Great Gatsby",
      "author": "F. Scott Fitzgerald",
      "isbn": "9780743273565"
    }
  }
}
```

### Return Book

**PUT** `/api/borrowings/:id/return`

Return a borrowed book.

**Response:**

```json
{
  "data": {
    "id": 1,
    "borrowerId": 1,
    "bookId": 1,
    "checkoutDate": "2024-01-15",
    "dueDate": "2024-02-15",
    "returnDate": "2024-01-20",
    "createdAt": "2024-01-15T13:00:00Z",
    "updatedAt": "2024-01-20T14:00:00Z",
    "borrower": {
      "id": 1,
      "name": "John Doe",
      "email": "john.doe@example.com"
    },
    "book": {
      "id": 1,
      "title": "The Great Gatsby",
      "author": "F. Scott Fitzgerald",
      "isbn": "9780743273565"
    }
  }
}
```

### Get Borrower's Current Books

**GET** `/api/borrowers/:id/current-books`

Get all books currently checked out by a specific borrower.

**Response:**

```json
{
  "data": [
    {
      "id": 1,
      "borrowerId": 1,
      "bookId": 1,
      "checkoutDate": "2024-01-15",
      "dueDate": "2024-02-15",
      "returnDate": null,
      "createdAt": "2024-01-15T13:00:00Z",
      "updatedAt": "2024-01-15T13:00:00Z",
      "book": {
        "id": 1,
        "title": "The Great Gatsby",
        "author": "F. Scott Fitzgerald",
        "isbn": "9780743273565"
      }
    }
  ]
}
```

### Get Overdue Books

**GET** `/api/borrowings/overdue`

Get all books that are currently overdue.

**Query Parameters:**

- `limit` (optional): Number of items per page (default: 10)
- `offset` (optional): Number of items to skip (default: 0)

**Response:**

```json
{
  "data": [
    {
      "id": 2,
      "borrowerId": 2,
      "bookId": 3,
      "checkoutDate": "2024-01-01",
      "dueDate": "2024-01-15",
      "returnDate": null,
      "createdAt": "2024-01-01T10:00:00Z",
      "updatedAt": "2024-01-01T10:00:00Z",
      "borrower": {
        "id": 2,
        "name": "Jane Smith",
        "email": "jane.smith@example.com"
      },
      "book": {
        "id": 3,
        "title": "1984",
        "author": "George Orwell",
        "isbn": "9780451524935"
      },
      "daysOverdue": 5
    }
  ],
  "meta": {
    "total": 3,
    "limit": 10,
    "offset": 0,
    "hasNext": false,
    "hasPrevious": false
  }
}
```

## Error Codes

| Code                    | Description                          |
| ----------------------- | ------------------------------------ |
| `VALIDATION_ERROR`      | Request validation failed            |
| `NOT_FOUND`             | Resource not found                   |
| `DUPLICATE_ENTRY`       | Resource already exists              |
| `INSUFFICIENT_QUANTITY` | Book not available for checkout      |
| `ALREADY_CHECKED_OUT`   | Book already checked out by borrower |
| `ALREADY_RETURNED`      | Book already returned                |
| `DATABASE_ERROR`        | Database operation failed            |
| `INTERNAL_ERROR`        | Internal server error                |
