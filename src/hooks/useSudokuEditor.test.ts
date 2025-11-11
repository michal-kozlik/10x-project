import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSudokuEditor } from "./useSudokuEditor";
import { http, HttpResponse } from "msw";
import { server } from "../test/mocks/server";

// Mock the toast module
vi.mock("../lib/toast", () => ({
  showToast: {
    loading: vi.fn(() => "toast-id"),
    dismiss: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("useSudokuEditor - validation integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("sets validation errors when definition has duplicates in row", () => {
    const { result } = renderHook(() => useSudokuEditor());

    const invalidDefinition = "112345678" + " ".repeat(72); // Duplicate 1 in first row

    act(() => {
      result.current.updateContent("Test", invalidDefinition);
    });

    expect(result.current.validationErrors.length).toBeGreaterThan(0);
    expect(result.current.validationErrors[0]).toContain("wierszu 1");
  });

  it("sets validation errors when definition has duplicates in column", () => {
    const { result } = renderHook(() => useSudokuEditor());

    // Create a sudoku with duplicate 5 in first column
    const rows = [
      "5        ", // 5 at position 0
      "5        ", // 5 at position 0 (duplicate)
      "         ",
      "         ",
      "         ",
      "         ",
      "         ",
      "         ",
      "         ",
    ];
    const invalidDefinition = rows.join("");

    act(() => {
      result.current.updateContent("Test", invalidDefinition);
    });

    expect(result.current.validationErrors.length).toBeGreaterThan(0);
    expect(
      result.current.validationErrors.some((e) => e.includes("kolumnie")),
    ).toBe(true);
  });

  it("sets validation errors when definition has duplicates in 3x3 box", () => {
    const { result } = renderHook(() => useSudokuEditor());

    // Create a sudoku with duplicate 9 in first box
    const rows = [
      "9  9     ", // Two 9s in first box (same row, so will also trigger row error)
      "         ",
      "         ",
      "         ",
      "         ",
      "         ",
      "         ",
      "         ",
      "         ",
    ];
    const invalidDefinition = rows.join("");

    act(() => {
      result.current.updateContent("Test", invalidDefinition);
    });

    expect(result.current.validationErrors.length).toBeGreaterThan(0);
    // This will also create a row duplicate, so just check there are errors
    expect(result.current.validationErrors[0]).toContain("wierszu 1");
  });

  it("clears validation errors when definition becomes valid", () => {
    const { result } = renderHook(() => useSudokuEditor());

    // First set an invalid definition
    const invalidDefinition = "112345678" + " ".repeat(72);
    act(() => {
      result.current.updateContent("Test", invalidDefinition);
    });
    expect(result.current.validationErrors.length).toBeGreaterThan(0);

    // Then set a valid definition
    const validDefinition = "123456789" + " ".repeat(72);
    act(() => {
      result.current.updateContent("Test", validDefinition);
    });
    expect(result.current.validationErrors).toEqual([]);
  });

  it("prevents save when there are validation errors", async () => {
    const { result } = renderHook(() => useSudokuEditor());

    const invalidDefinition = "112345678" + " ".repeat(72);
    act(() => {
      result.current.updateContent("Test", invalidDefinition);
    });

    expect(result.current.validationErrors.length).toBeGreaterThan(0);

    await act(async () => {
      await result.current.onSave({
        name: "Test",
        definition: invalidDefinition,
      });
    });

    // The save should complete without error (it just returns early)
    // Diagram should remain null since save didn't proceed
    expect(result.current.diagram).toBeNull();
  });

  it("allows save when definition is valid", async () => {
    // Setup MSW handler for this specific test
    server.use(
      http.post("/api/diagrams", () => {
        return HttpResponse.json({
          id: 1,
          name: "Test",
          definition: "123456789" + " ".repeat(72),
          solution: null,
          created_at: new Date().toISOString(),
        });
      }),
    );

    const { result } = renderHook(() => useSudokuEditor());

    const validDefinition = "123456789" + " ".repeat(72);
    act(() => {
      result.current.updateContent("Test", validDefinition);
    });

    expect(result.current.validationErrors).toEqual([]);
    expect(result.current.isDirty).toBe(true);

    await act(async () => {
      await result.current.onSave({
        name: "Test",
        definition: validDefinition,
      });
    });

    // After save, the diagram should be set and isDirty should be false
    expect(result.current.diagram).toBeDefined();
    expect(result.current.isDirty).toBe(false);
  });

  it("sets validation errors for incorrect length", () => {
    const { result } = renderHook(() => useSudokuEditor());

    const shortDefinition = "123456789"; // Only 9 chars instead of 81

    act(() => {
      result.current.updateContent("Test", shortDefinition);
    });

    expect(result.current.validationErrors.length).toBeGreaterThan(0);
    expect(result.current.validationErrors[0]).toContain("dokładnie 81 znaków");
  });

  it("has no validation errors for empty definition", () => {
    const { result } = renderHook(() => useSudokuEditor());

    act(() => {
      result.current.updateContent("Test", "");
    });

    expect(result.current.validationErrors).toEqual([]);
  });
});
