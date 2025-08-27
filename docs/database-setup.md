# Database Setup Guide

This guide covers database configuration, schema management, and utilities for the Library Management System using Prisma ORM.

## Prerequisites

- PostgreSQL 14+ installed and running
- Node.js 18+ installed
- Environment variables configured (see `.env.example`)

## Environment Configuration

Copy `.env.example` to `.env` and update the database configuration:

```bash
# Database Config
DATABASE_URL="postgresql://your_username:your_password@localhost:5432/library_management?schema=public"
```

For testing, you can create a separate test database URL.

## Quick Setup Commands

```bash
npm run db:setup           # Complete setup (create DB + generate + migrate + seed)
npm run db:test-connection # Test database connection
npm run db:studio          # Open Prisma Studio
npm run db:reset           # Reset database (drop all tables and recreate)
```

## Database Schema

The Prisma schema defines three main models with the following relationships:

```mermaid
erDiagram
    books {
        int id PK "SERIAL, AUTO_INCREMENT"
        varchar title "VARCHAR(255), NOT NULL, INDEX"
        varchar author "VARCHAR(255), NOT NULL, INDEX"
        varchar isbn "VARCHAR(13), UNIQUE INDEX"
        int total_quantity "INTEGER, NOT NULL"
        int available_quantity "INTEGER, NOT NULL"
        varchar shelf_location "VARCHAR(50), NOT NULL"
        timestamp created_at "TIMESTAMP(3), DEFAULT NOW()"
        timestamp updated_at "TIMESTAMP(3), NOT NULL"
    }

    borrowers {
        int id PK "SERIAL, AUTO_INCREMENT"
        varchar name "VARCHAR(255), NOT NULL"
        varchar email "VARCHAR(255), UNIQUE INDEX"
        date registered_date "DATE, DEFAULT NOW()"
        timestamp created_at "TIMESTAMP(3), DEFAULT NOW()"
        timestamp updated_at "TIMESTAMP(3), NOT NULL"
    }

    borrowings {
        int id PK "SERIAL, AUTO_INCREMENT"
        int borrower_id FK "INTEGER, NOT NULL, REFERENCES borrowers(id)"
        int book_id FK "INTEGER, NOT NULL, REFERENCES books(id)"
        date checkout_date "DATE, DEFAULT NOW()"
        date due_date "DATE, NOT NULL"
        date return_date "DATE, NULLABLE"
        timestamp created_at "TIMESTAMP(3), DEFAULT NOW()"
        timestamp updated_at "TIMESTAMP(3), NOT NULL"
    }

    books ||--o{ borrowings : "has many (RESTRICT delete, CASCADE update)"
    borrowers ||--o{ borrowings : "has many (RESTRICT delete, CASCADE update)"
```

## Sample Data

The seeder provides sample data including:

- 5 sample books with different availability statuses
- 4 sample borrowers with valid email addresses
- Sample borrowing records (active, returned, and overdue)
