import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { SolvedDiagramView } from "./SolvedDiagramView";

const SOL = "123456789".repeat(9); // 81 chars

describe("SolvedDiagramView", () => {
  it("renders 81 cells in a 9x9 grid", () => {
    const { container } = render(<SolvedDiagramView solution={SOL} />);
    const grid = container.querySelector("div.grid.grid-cols-9");
    expect(grid).toBeTruthy();
    const cells = grid?.querySelectorAll(":scope > div");
    expect(cells?.length).toBe(81);
  });

  it("applies 3x3 block borders correctly", () => {
    const { container } = render(<SolvedDiagramView solution={SOL} />);
    const grid = container.querySelector("div.grid.grid-cols-9");
    expect(grid).toBeTruthy();
    const cells = Array.from(grid?.querySelectorAll(":scope > div") || []);

    // Helper to pick cell by row/col
    const idx = (row: number, col: number) => row * 9 + col;

    // Vertical separators at col 2 and 5 (except last col)
    expect(cells[idx(0, 2)].className).toMatch(/border-r-2/);
    expect(cells[idx(0, 5)].className).toMatch(/border-r-2/);
    expect(cells[idx(0, 8)].className).not.toMatch(/border-r-2/);

    // Horizontal separators at row 2 and 5 (except last row)
    expect(cells[idx(2, 0)].className).toMatch(/border-b-2/);
    expect(cells[idx(5, 0)].className).toMatch(/border-b-2/);
    expect(cells[idx(8, 0)].className).not.toMatch(/border-b-2/);
  });
});
