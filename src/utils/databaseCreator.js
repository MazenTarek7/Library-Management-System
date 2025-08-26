const { Client } = require("pg");
const winston = require("winston");

/**
 * Database creation utility for PostgreSQL
 */
class DatabaseCreator {
  /**
   * Parse DATABASE_URL to get connection components
   */
  static parseDatabaseUrl(url) {
    const match = url.match(
      /postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)/
    ); // Regex to match postgres URL connection string to get values from .env
    if (!match) {
      throw new Error("Invalid DATABASE_URL format");
    }

    const [, user, password, host, port, database] = match;
    return { user, password, host, port: parseInt(port), database };
  }

  /**
   * Create database if it doesn't exist
   */
  static async createDatabase() {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error("DATABASE_URL environment variable is required");
    }

    const { user, password, host, port, database } =
      this.parseDatabaseUrl(databaseUrl);

    const client = new Client({
      user,
      password,
      host,
      port,
      database: "postgres",
    });

    try {
      await client.connect();
      winston.info(`Connected to PostgreSQL server at ${host}:${port}`);

      // Check if database exists
      const checkResult = await client.query(
        "SELECT 1 FROM pg_database WHERE datname = $1",
        [database]
      );

      if (checkResult.rows.length === 0) {
        // Database doesn't exist, create it
        winston.info(`Creating database: ${database}`);
        await client.query(`CREATE DATABASE "${database}"`);
        winston.info(`Database "${database}" created successfully`);
      } else {
        winston.info(`Database "${database}" already exists`);
      }

      return true;
    } catch (error) {
      winston.error("Error creating database", {
        error: error.message,
        database,
        host,
        port,
        user,
      });
      throw error;
    } finally {
      await client.end();
    }
  }

  /**
   * Test connection to PostgreSQL server
   */
  static async testServerConnection() {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error("DATABASE_URL environment variable is required");
    }

    const { user, password, host, port } = this.parseDatabaseUrl(databaseUrl);

    const client = new Client({
      user,
      password,
      host,
      port,
      database: "postgres",
    });

    try {
      await client.connect();
      const result = await client.query("SELECT version()");
      winston.info("PostgreSQL server connection successful", {
        version:
          result.rows[0].version.split(" ")[0] +
          " " +
          result.rows[0].version.split(" ")[1],
        host,
        port,
      });
      return true;
    } catch (error) {
      winston.error("PostgreSQL server connection failed", {
        error: error.message,
        host,
        port,
        user,
      });
      return false;
    } finally {
      await client.end();
    }
  }

  /**
   * Drop database
   */
  static async dropDatabase() {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error("DATABASE_URL environment variable is required");
    }

    const { user, password, host, port, database } =
      this.parseDatabaseUrl(databaseUrl);

    const client = new Client({
      user,
      password,
      host,
      port,
      database: "postgres",
    });

    try {
      await client.connect();

      await client.query(
        `
        SELECT pg_terminate_backend(pid)
        FROM pg_stat_activity
        WHERE datname = $1 AND pid <> pg_backend_pid()
      `,
        [database]
      );

      // Drop the database
      winston.warn(`Dropping database: ${database}`);
      await client.query(`DROP DATABASE IF EXISTS "${database}"`);
      winston.info(`Database "${database}" dropped successfully`);

      return true;
    } catch (error) {
      winston.error("Error dropping database", {
        error: error.message,
        database,
      });
      throw error;
    } finally {
      await client.end();
    }
  }
}

module.exports = DatabaseCreator;
