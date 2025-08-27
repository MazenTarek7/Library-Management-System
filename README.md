# Library Management System

A RESTful API for library management built with Node.js, Express.js, and PostgreSQL.

## Features

- Book inventory management
- Borrower registration and management
- Book checkout and return tracking
- Overdue book monitoring
- RESTful API design with proper error handling

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- npm or yarn

## Installation

### Local Development

1. Clone the repository
2. Install dependencies:

   ```bash
   npm install
   ```

3. Copy environment configuration:

   ```bash
   cp .env.example .env
   ```

4. Update the `.env` file with your database configuration

### Docker Development (Recommended)

1. Clone the repository
2. Start the development environment:

   ```bash
   npm run docker:up
   ```

3. Setup the database:

   ```bash
   npm run db:setup
   ```

4. The API will be available at `http://localhost:3000`

## Available Scripts

### Development Scripts

- `npm start` - Start the production server
- `npm run dev` - Start the development server with nodemon
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report

### Database Scripts

- `npm run db:setup` - Setup database schema and seed data
- `npm run db:test-connection` - Test database connection
- `npm run db:reset` - Reset database

### Docker Scripts

- `npm run docker:up` - Start development environment
- `npm run docker:down` - Stop development environment
- `npm run docker:logs` - View application logs

## Project Structure

```
src/
├── app.js              # Express application setup
├── config/             # Configuration files
├── middleware/         # Custom middleware
├── models/             # Data models
├── repositories/       # Data access layer
├── routes/             # API route definitions
├── services/           # Business logic layer
└── utils/              # Utility functions

tests/
├── integration/        # Integration tests
├── unit/              # Unit tests
└── setup.js           # Test configuration
```

## API Endpoints

The API includes the following endpoints:

### Books

- `GET /api/books` - List all books
- `GET /api/books/:id` - Get book by ID
- `POST /api/books` - Create new book
- `PUT /api/books/:id` - Update book
- `DELETE /api/books/:id` - Delete book

### Borrowers

- `GET /api/borrowers` - List all borrowers
- `GET /api/borrowers/:id` - Get borrower by ID
- `POST /api/borrowers` - Register new borrower
- `PUT /api/borrowers/:id` - Update borrower
- `DELETE /api/borrowers/:id` - Delete borrower

### Borrowings

- `POST /api/borrowings/checkout` - Check out a book
- `PUT /api/borrowings/:id/return` - Return a book
- `GET /api/borrowers/:id/current-books` - Get borrower's current books
- `GET /api/borrowings/overdue` - Get overdue books

## Docker Support

Docker is setup to run the application for more details check [docker-README.md](docker-README.md).

## License

MIT
