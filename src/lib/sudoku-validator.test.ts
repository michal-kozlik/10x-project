import { describe, it, expect } from "vitest";
import { validateSudokuDefinition } from "./sudoku-validator";

describe("validateSudokuDefinition", () => {
  it("returns no errors for empty definition", () => {
    expect(validateSudokuDefinition("")).toEqual([]);
    expect(validateSudokuDefinition("   ")).toEqual([]);
  });

  it("returns no errors for valid empty sudoku (all spaces)", () => {
    const emptyGrid = " ".repeat(81);
    expect(validateSudokuDefinition(emptyGrid)).toEqual([]);
  });

  it("returns error for incorrect length", () => {
    const errors = validateSudokuDefinition("123456789");
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain("dokładnie 81 znaków");
  });

  it("returns error for invalid characters", () => {
    const invalidGrid = "A".repeat(81);
    const errors = validateSudokuDefinition(invalidGrid);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain("Nieprawidłowe znaki");
  });

  it("returns no errors for valid complete sudoku", () => {
    const validSudoku =
      "534678912" +
      "672195348" +
      "198342567" +
      "859761423" +
      "426853791" +
      "713924856" +
      "961537284" +
      "287419635" +
      "345286179";
    expect(validateSudokuDefinition(validSudoku)).toEqual([]);
  });

  it("returns no errors for valid partial sudoku", () => {
    const partialSudoku =
      "53  7    " +
      "6  195   " +
      " 98    6 " +
      "8   6   3" +
      "4  8 3  1" +
      "7   2   6" +
      " 6    28 " +
      "   419  5" +
      "    8  79";
    expect(validateSudokuDefinition(partialSudoku)).toEqual([]);
  });

  it("detects duplicate in row", () => {
    const duplicateRow =
      "553678912" + // Duplicate 5 in row 1
      "672195348" +
      "198342567" +
      "859761423" +
      "426853791" +
      "713924856" +
      "961537284" +
      "287419635" +
      "345286179";
    const errors = validateSudokuDefinition(duplicateRow);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]).toContain("wierszu 1");
    expect(errors[0]).toContain("5");
  });

  it("detects duplicate in column", () => {
    const duplicateCol =
      "534678912" +
      "572195348" + // Changed first digit to 5 (duplicate in column 1)
      "198342567" +
      "859761423" +
      "426853791" +
      "713924856" +
      "961537284" +
      "287419635" +
      "345286179";
    const errors = validateSudokuDefinition(duplicateCol);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.includes("kolumnie"))).toBe(true);
  });

  it("detects duplicate in 3x3 box", () => {
    const duplicateBox =
      "535678912" + // Second 5 creates duplicate in first box
      "672195348" +
      "198342567" +
      "859761423" +
      "426853791" +
      "713924856" +
      "961537284" +
      "287419635" +
      "345286179";
    const errors = validateSudokuDefinition(duplicateBox);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.includes("bloku 3x3"))).toBe(true);
  });

  it("detects multiple errors", () => {
    const multipleErrors =
      "111111111" + // Row 1: multiple duplicates
      "         " +
      "         " +
      "         " +
      "         " +
      "         " +
      "         " +
      "         " +
      "         ";
    const errors = validateSudokuDefinition(multipleErrors);
    expect(errors.length).toBeGreaterThan(1); // Should have row, column, and box errors
  });

  it("handles definition with newlines", () => {
    const withNewlines =
      "53  7    \n" +
      "6  195   \n" +
      " 98    6 \n" +
      "8   6   3\n" +
      "4  8 3  1\n" +
      "7   2   6\n" +
      " 6    28 \n" +
      "   419  5\n" +
      "    8  79";
    expect(validateSudokuDefinition(withNewlines)).toEqual([]);
  });

  it("detects duplicate when there are spaces", () => {
    const duplicateWithSpaces =
      "5   5    " + // Two 5's in first row
      "         " +
      "         " +
      "         " +
      "         " +
      "         " +
      "         " +
      "         " +
      "         ";
    const errors = validateSudokuDefinition(duplicateWithSpaces);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]).toContain("wierszu 1");
    expect(errors[0]).toContain("5");
  });
});
