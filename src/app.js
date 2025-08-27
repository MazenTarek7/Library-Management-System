const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const { bookRoutes, borrowerRoutes, borrowingRoutes } = require("./routes");
const { ErrorHandlerMiddleware } = require("./middleware");
require("dotenv").config();

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// API routes
app.use("/api/books", bookRoutes);
app.use("/api/borrowers", borrowerRoutes);
app.use("/api/borrowings", borrowingRoutes);

app.use("/api/*", (req, res) => {
  res.status(404).json({
    error: {
      code: "NOT_FOUND",
      message: "API endpoint not found",
      path: req.originalUrl,
    },
  });
});

// Handle 404 for all other routes
app.use("*", (req, res) => {
  res.status(404).json({
    error: {
      code: "NOT_FOUND",
      message: `Route ${req.originalUrl} not found`,
    },
  });
});

app.use(ErrorHandlerMiddleware.handle);

const PORT = process.env.PORT || 3000;
let server;

function gracefulShutdown(signal) {
  console.log(`Received ${signal}. Starting graceful shutdown...`);

  if (server) {
    server.close((err) => {
      if (err) {
        console.error("Error during server shutdown:", err);
        process.exit(1);
      }
      console.log("Graceful shutdown completed");
      process.exit(0);
    });

    setTimeout(() => {
      console.error("Forced shutdown after timeout");
      process.exit(1);
    }, 10000);
  } else {
    process.exit(0);
  }
}

// graceful shutdown signals
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// if file is run directly
if (require.main === module) {
  server = app.listen(PORT, () => {
    console.log(`Library Management System API running on port ${PORT}`);
  });

  server.on("error", (error) => {
    if (error.code === "EADDRINUSE") {
      console.error(`Port ${PORT} is already in use`);
      process.exit(1);
    }
    throw error;
  });
}

module.exports = { app, gracefulShutdown };
