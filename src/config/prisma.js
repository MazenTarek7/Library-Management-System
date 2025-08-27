const { PrismaClient } = require("@prisma/client");
const logger = require("./logger");

// Create Prisma client instance with logging configuration
const prisma = new PrismaClient({
  log: [
    {
      emit: "event",
      level: "query",
    },
    {
      emit: "event",
      level: "error",
    },
    {
      emit: "event",
      level: "info",
    },
    {
      emit: "event",
      level: "warn",
    },
  ],
});

// Set up event listeners for logging
prisma.$on("query", (e) => {
  logger.debug("Prisma Query", {
    query: e.query,
    params: e.params,
    duration: `${e.duration}ms`,
    target: e.target,
  });
});

prisma.$on("error", (e) => {
  logger.error("Prisma Error", {
    message: e.message,
    target: e.target,
  });
});

prisma.$on("info", (e) => {
  logger.info("Prisma Info", {
    message: e.message,
    target: e.target,
  });
});

prisma.$on("warn", (e) => {
  logger.warn("Prisma Warning", {
    message: e.message,
    target: e.target,
  });
});

// Graceful shutdown
process.on("beforeExit", async () => {
  logger.info("Disconnecting Prisma client...");
  await prisma.$disconnect();
});

module.exports = prisma;
