const prisma = require("../config/prisma");
const logger = require("../config/logger");

/**
 * Database utility class using Prisma ORM
 */
class DatabaseUtil {
  /**
   * Test database connection
   * @returns {Promise<boolean>} True if connection successful
   */
  static async testConnection() {
    try {
      await prisma.$queryRaw`SELECT NOW()`;
      logger.info("Database connection test successful");
      return true;
    } catch (error) {
      logger.error("Database connection test failed", {
        error: error.message,
      });
      return false;
    }
  }

  /**
   * Execute a raw query with error handling
   * @param {string} query - SQL query template literal
   * @param {...any} params - Query parameters
   * @returns {Promise<any>} Query result
   */
  static async rawQuery(query, ...params) {
    try {
      const result = await prisma.$queryRaw(query, ...params);
      logger.debug("Executed raw query", { query: query.toString() });
      return result;
    } catch (error) {
      logger.error("Raw query error", {
        query: query.toString(),
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Execute multiple operations in a transaction
   * @param {Function} callback - Function containing Prisma operations
   * @returns {Promise<any>} Transaction result
   */
  static async transaction(callback) {
    try {
      logger.debug("Transaction started");
      const result = await prisma.$transaction(callback);
      logger.debug("Transaction committed");
      return result;
    } catch (error) {
      logger.error("Transaction rolled back", { error: error.message });
      throw error;
    }
  }

  /**
   * Get database connection information
   * @returns {Promise<Object>} Connection info
   */
  static async getConnectionInfo() {
    try {
      const result = await prisma.$queryRaw`
        SELECT 
          current_database() as database_name,
          current_user as user_name,
          version() as version,
          NOW() as current_time
      `;
      return result[0];
    } catch (error) {
      logger.error("Error getting connection info", { error: error.message });
      throw error;
    }
  }

  /**
   * Close database connection
   * @returns {Promise<void>}
   */
  static async disconnect() {
    try {
      await prisma.$disconnect();
      logger.info("Prisma client disconnected");
    } catch (error) {
      logger.error("Error disconnecting Prisma client", {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get Prisma client instance
   * @returns {PrismaClient} Prisma client
   */
  static getClient() {
    return prisma;
  }
}

module.exports = DatabaseUtil;
