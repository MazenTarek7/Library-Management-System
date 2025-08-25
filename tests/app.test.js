const request = require("supertest");
const app = require("../src/app");

describe("Basic App Configuration", () => {
  test("should respond to health check", async () => {
    const response = await request(app).get("/health").expect(200);

    expect(response.body).toHaveProperty("status", "OK");
    expect(response.body).toHaveProperty(
      "service",
      "Library Management System"
    );
    expect(response.body).toHaveProperty("timestamp");
  });

  test("should return 404 for unknown routes", async () => {
    const response = await request(app).get("/unknown-route").expect(404);

    expect(response.body).toHaveProperty("error");
    expect(response.body.error).toHaveProperty("code", "NOT_FOUND");
  });

  test("should return 404 for API routes (not yet implemented)", async () => {
    const response = await request(app).get("/api/books").expect(404);

    expect(response.body).toHaveProperty("error");
    expect(response.body.error).toHaveProperty("code", "NOT_FOUND");
  });
});
