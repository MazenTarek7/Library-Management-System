# Docker Setup

## Quick Start

1. **Start the application with Docker:**

   ```bash
   npm run docker:up
   ```

2. **The application will be available at:**

   - API: http://localhost:3000
   - Database: localhost:5432

3. **Stop the application:**
   ```bash
   npm run docker:down
   ```

## What `docker:up` does:

1. **PostgreSQL Database** starts with:

   - Database: `library_management_dev`
   - Username: `library_user`
   - Password: `library_password`
   - Port: 5432

2. **API Application** starts with:
   - Connects to the PostgreSQL database automatically
   - Runs in development mode with hot reloading
   - Available on port 3000

## Database Setup

After starting Docker, setup the database schema and seed data:

```bash
# To be run once
npm run db:setup
```

This will create the tables and add sample data to your database.

## Viewing Logs

```bash
npm run docker:logs
```

## Environment Variables

The Docker setup uses these database connection values automatically:

- `DATABASE_URL=postgresql://library_user:library_password@postgres:5432/library_management_dev?schema=public`
