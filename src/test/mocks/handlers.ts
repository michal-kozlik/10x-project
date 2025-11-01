import { http, HttpResponse } from "msw";

export const handlers = [
  // Add your API mocks here
  http.get("/api/example", () => {
    return HttpResponse.json({ message: "Mocked response" });
  }),
];
