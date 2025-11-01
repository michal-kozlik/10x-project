import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeAll, afterAll } from "vitest";
import { server } from "./mocks/server";

beforeAll(() => {
  // Start the MSW server before all tests
  server.listen({ onUnhandledRequest: "error" });
});

afterEach(() => {
  // Clean up after each test
  cleanup();
  server.resetHandlers();
});

afterAll(() => {
  // Clean up after all tests are done
  server.close();
});
