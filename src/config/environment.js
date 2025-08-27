require("dotenv").config();

const config = {
  NODE_ENV: process.env.NODE_ENV || "development",

  port: parseInt(process.env.PORT) || 3000,

  database: {
    url:
      process.env.DATABASE_URL ||
      "postgresql://library_user:library_password@localhost:5432/library_management_dev?schema=public",
  },

  logging: {
    level: process.env.LOG_LEVEL || "info",
  },
};

module.exports = config;
