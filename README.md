# Library Management System

A RESTful API for library management built with Node.js, Express.js, and PostgreSQL.

## Features

- Book inventory management
- Borrower registration and management
- Book checkout and return tracking
- Overdue book monitoring
- RESTful API design with proper error handling
- Docker support

## Quick Start

### Option 1: Docker (Recommended for Development)

```bash
npm run docker:up

# Setup database schema and seed data
npm run db:setup

# Access the API at http://localhost:3000
```

### Option 2: Local Development

```bash
# Install dependencies
npm install

# Copy and configure environment
cp .env.example .env

# Setup database
npm run db:setup

# Start development server
npm run dev
```

## Documentation

- **[Docker Setup](docker-README.md)** - Complete Docker configuration and usage
- **[Database Setup](docs/database-setup.md)** - Database configuration, schema, and management
- **[API Documentation](docs/api-documentation.md)** - Detailed API endpoints with examples

## Available Scripts

### Development

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm test` - Run test suite
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Generate coverage report

### Database

- `npm run db:setup` - Setup database schema and seed data
- `npm run db:test-connection` - Test database connection
- `npm run db:reset` - Reset database
- `npm run db:studio` - Open Prisma Studio

### Docker

- `npm run docker:up` - Start development environment
- `npm run docker:down` - Stop development environment
- `npm run docker:logs` - View application logs

## Project Structure

```
src/
├── app.js              # Express application setup
├── config/             # Configuration files
├── middleware/         # Custom middleware
├── models/             # Data models and validation
├── repositories/       # Data access layer
├── routes/             # API route definitions
├── services/           # Business logic layer
└── utils/              # Utility functions

tests/
├── integration/        # Integration tests
├── unit/              # Unit tests
└── setup.js           # Test configuration
```

## API Overview

The API provides endpoints for:

- **Books**: CRUD operations for book inventory
- **Borrowers**: User registration and management
- **Borrowings**: Checkout/return operations and overdue tracking

For detailed API documentation with examples, check [API Documentation](docs/api-documentation.md).

## License

MIT
