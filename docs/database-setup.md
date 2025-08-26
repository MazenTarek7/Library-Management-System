# Database Setup Guide

This guide explains how to set up and manage the PostgreSQL database for the Library Management System using Prisma ORM.

## Prerequisites

1. PostgreSQL 14+ installed and running
2. Node.js 18+ installed
3. Environment variables configured (see `.env.example`)

## Environment Configuration

Copy `.env.example` to `.env` and update the database configuration:

```bash
# Database Config
DATABASE_URL="postgresql://your_username:your_password@localhost:5432/library_management?schema=public"
```

For testing, you can create a separate test database URL.

## Database Setup Commands

### Essential Commands (All You Need!)

```bash
npm run db:setup           # Complete setup (create DB + generate + migrate + seed)
npm run db:test-connection # Test database connection
npm run db:studio          # Open Prisma Studio (visual database browser)
npm run db:reset           # Reset database (drop all tables and recreate)
```

### Quick Start

For first-time setup, just run:

```bash
npm run db:setup
```

### Reset Database (Drop all tables and recreate)

```bash
npm run db:reset
```

### Clear All Data

```bash
npm run db:clear
```

### Open Prisma Studio (Database GUI)

```bash
npm run db:studio
```

## Database Schema

The Prisma schema defines three main models:

### Book Model

- `id` (Auto-increment Primary Key)
- `title` (String, max 255 chars)
- `author` (String, max 255 chars)
- `isbn` (String, unique, max 13 chars)
- `totalQuantity` (Integer)
- `availableQuantity` (Integer)
- `shelfLocation` (String, max 50 chars)
- `createdAt` (DateTime, auto-generated)
- `updatedAt` (DateTime, auto-updated)
- `borrowings` (Relation to Borrowing[])

### Borrower Model

- `id` (Auto-increment Primary Key)
- `name` (String, max 255 chars)
- `email` (String, unique, max 255 chars)
- `registeredDate` (Date, defaults to current date)
- `createdAt` (DateTime, auto-generated)
- `updatedAt` (DateTime, auto-updated)
- `borrowings` (Relation to Borrowing[])

### Borrowing Model

- `id` (Auto-increment Primary Key)
- `borrowerId` (Foreign Key to Borrower)
- `bookId` (Foreign Key to Book)
- `checkoutDate` (Date, defaults to current date)
- `dueDate` (Date)
- `returnDate` (Date, nullable)
- `createdAt` (DateTime, auto-generated)
- `updatedAt` (DateTime, auto-updated)
- `borrower` (Relation to Borrower)
- `book` (Relation to Book)

### Prisma Studio

Visual database browser accessible via `npm run db:studio`.

## Sample Data

The seeder provides realistic sample data including:

- 5 sample books with different availability statuses
- 4 sample borrowers with valid email addresses
- Sample borrowing records (active, returned, and overdue)

## Database Utilities

### DatabaseUtil Class

- `testConnection()` - Test database connectivity using Prisma
- `rawQuery(query, ...params)` - Execute raw SQL queries
- `transaction(callback)` - Execute operations in transactions
- `getConnectionInfo()` - Get database connection information
- `disconnect()` - Close Prisma client connection
- `getClient()` - Get Prisma client instance

### Seeder Class

- `seedAll()` - Seed all tables with sample data using Prisma
- `clearAll()` - Clear all data from tables using Prisma
- `getSampleBooks()` - Get sample book data
- `getSampleBorrowers()` - Get sample borrower data
- `getSampleBorrowings()` - Get sample borrowing data

## Error Handling

All database operations include comprehensive error handling:

- Connection errors are logged and re-thrown
- Query errors include context information
- Transaction failures trigger automatic rollback
- Prisma client errors are properly formatted

## Troubleshooting

### Connection Issues

1. Verify PostgreSQL is running
2. Check DATABASE_URL format in `.env`
3. Ensure database exists (create manually if needed)
4. Test connection with `npm run db:test-connection`

### Migration Issues

1. Check Prisma schema syntax
2. Verify database permissions
3. Review migration logs for specific errors
4. Use `npx prisma migrate reset` to start fresh

### Prisma Client Issues

1. Regenerate client with `npm run db:generate`
2. Check for schema changes that need migration
3. Verify Prisma version compatibility
