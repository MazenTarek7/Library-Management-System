const { PrismaClient } = require("@prisma/client");
const winston = require("winston");

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
  winston.debug("Prisma Query", {
    query: e.query,
    params: e.params,
    duration: `${e.duration}ms`,
    target: e.target,
  });
});

prisma.$on("error", (e) => {
  winston.error("Prisma Error", {
    message: e.message,
    target: e.target,
  });
});

prisma.$on("info", (e) => {
  winston.info("Prisma Info", {
    message: e.message,
    target: e.target,
  });
});

prisma.$on("warn", (e) => {
  winston.warn("Prisma Warning", {
    message: e.message,
    target: e.target,
  });
});

// Graceful shutdown
process.on("beforeExit", async () => {
  winston.info("Disconnecting Prisma client...");
  await prisma.$disconnect();
});

module.exports = prisma;
