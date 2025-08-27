# Docker Setup

This guide covers Docker configuration and usage.

## Quick Start

1. **Start the application with Docker:**

   ```bash
   npm run docker:up
   ```

2. **Setup the database (first time only):**

   ```bash
   npm run db:setup
   ```

3. **Access the application:**

   - API: http://localhost:3000
   - Database: localhost:5432

4. **Stop the application:**

   ```bash
   npm run docker:down
   ```

## What Gets Started

### PostgreSQL Database

- **Database**: `library_management_dev`
- **Username**: `library_user`
- **Password**: `library_password`
- **Port**: 5432
- **Host**: `postgres` (within Docker network)

### API Application

- **Port**: 3000
- **Mode**: Development with hot reloading
- **Database Connection**: Automatically configured for Docker environment

## Docker Commands

```bash
# Start development environment
npm run docker:up

# Stop development environment
npm run docker:down

# View application logs
npm run docker:logs

## Environment Configuration

The Docker setup automatically uses these environment variables:

DATABASE_URL=postgresql://library_user:library_password@postgres:5432/library_management_dev?schema=public
NODE_ENV=development
PORT=3000
```

## Database Management

After starting Docker, you can manage the database using these commands:

```bash
# Setup database schema and seed data
npm run db:setup

# Reset database (drop all tables and recreate)
npm run db:reset

# Open Prisma Studio (database GUI)
npm run db:studio

# Test database connection
npm run db:test-connection
```

For detailed database setup and management, see [Database Setup Guide](docs/database-setup.md).

## Development Workflow

1. Start containers: `npm run docker:up`
2. Setup database: `npm run db:setup` (first time only)
3. Make code changes (auto-reload enabled)
4. Stop containers: `npm run docker:down`
