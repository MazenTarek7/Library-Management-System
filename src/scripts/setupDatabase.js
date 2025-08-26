#!/usr/bin/env node

require("dotenv").config();
const winston = require("winston");
const { execSync } = require("child_process");
const Seeder = require("../utils/seeder");
const DatabaseUtil = require("../utils/database");
const DatabaseCreator = require("../utils/databaseCreator");

winston.configure({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.colorize(),
    winston.format.simple()
  ),
  transports: [new winston.transports.Console()],
});

/**
 * Database setup script using Prisma
 */
class DatabaseSetup {
  static async run() {
    const args = process.argv.slice(2);
    const command = args[0] || "migrate";

    try {
      winston.info("Testing PostgreSQL server connection...");
      const serverConnected = await DatabaseCreator.testServerConnection();

      if (!serverConnected) {
        winston.error(
          "PostgreSQL server connection failed. Please check your configuration."
        );
        process.exit(1);
      }

      // Create database if it doesn't exist
      await DatabaseCreator.createDatabase();

      // Test database connection
      winston.info("Testing database connection...");
      const isConnected = await DatabaseUtil.testConnection();

      if (!isConnected) {
        winston.error(
          "Database connection failed after creation. Please check your configuration."
        );
        process.exit(1);
      }

      switch (command) {
        case "migrate":
          winston.info("Running Prisma migrations...");
          execSync("npx prisma migrate dev --name init", { stdio: "inherit" });
          break;

        case "generate":
          winston.info("Generating Prisma client...");
          execSync("npx prisma generate", { stdio: "inherit" });
          break;

        case "seed":
          await Seeder.seedAll();
          break;

        case "setup":
          winston.info("Running complete database setup...");
          winston.info("Step 1: Generating Prisma client...");
          try {
            execSync("npx prisma generate", { stdio: "inherit" });
          } catch (error) {
            winston.warn("Prisma generate failed, but continuing...");
          }
          winston.info("Step 2: Running migrations...");
          execSync("npx prisma migrate dev --name init", { stdio: "inherit" });
          winston.info("Step 3: Seeding database...");
          await Seeder.seedAll();
          break;

        case "reset":
          winston.warn("This will delete all data and reset the database");
          execSync("npx prisma migrate reset --force", { stdio: "inherit" });
          await Seeder.seedAll();
          break;

        case "clear":
          await Seeder.clearAll();
          break;

        case "studio":
          winston.info("Opening Prisma Studio...");
          execSync("npx prisma studio", { stdio: "inherit" });
          break;

        case "create-db":
          await DatabaseCreator.createDatabase();
          break;

        case "drop-db":
          winston.warn("This will permanently delete the entire database!");
          await DatabaseCreator.dropDatabase();
          break;

        case "test-server":
          const serverOk = await DatabaseCreator.testServerConnection();
          winston.info(
            serverOk
              ? "Server connection successful"
              : "Server connection failed"
          );
          break;

        case "test-connection":
          winston.info("Database connection test completed successfully");
          break;

        default:
          winston.info("Available commands:");
          winston.info(
            "  create-db      - Create database if it doesn't exist"
          );
          winston.info(
            "  drop-db        - Drop database (WARNING: destructive)"
          );
          winston.info("  test-server    - Test PostgreSQL server connection");
          winston.info("  test-connection - Test database connection");
          winston.info("  generate       - Generate Prisma client");
          winston.info("  migrate        - Run Prisma migrations");
          winston.info("  seed          - Seed database with sample data");
          winston.info(
            "  setup         - Complete setup (create DB, generate, migrate, seed)"
          );
          winston.info("  reset         - Reset database and seed data");
          winston.info("  clear         - Clear all data from tables");
          winston.info("  studio        - Open Prisma Studio");
          break;
      }

      winston.info("Database setup completed successfully");
      process.exit(0);
    } catch (error) {
      winston.error("Database setup failed", { error: error.message });
      process.exit(1);
    } finally {
      await DatabaseUtil.disconnect();
    }
  }
}

// Run the setup if this file is executed directly
if (require.main === module) {
  DatabaseSetup.run();
}

module.exports = DatabaseSetup;
