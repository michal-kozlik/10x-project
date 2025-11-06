import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import EditorPanel from "./EditorPanel";
import type { DiagramDTO } from "@/types";

// Mock the editor hook used by EditorPanel
const mockHook = {
  diagram: null as DiagramDTO | null,
  isDirty: true,
  validationErrors: [] as string[],
  onSave: vi.fn(),
  onSolve: vi.fn(),
  onClear: vi.fn(),
  updateContent: vi.fn(),
};

vi.mock("@/hooks/useSudokuEditor", () => ({
  useSudokuEditor: () => mockHook,
}));

describe("EditorPanel", () => {
  beforeEach(() => {
    mockHook.diagram = null;
    mockHook.isDirty = true;
    mockHook.validationErrors = [];
    mockHook.onSave.mockReset();
    mockHook.onSolve.mockReset();
    mockHook.onClear.mockReset();
    mockHook.updateContent.mockReset();
  });

  it("renders SudokuEditor and not SolvedDiagramView when no solution", () => {
    render(<EditorPanel />);
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.queryByText(/solution/i)).not.toBeInTheDocument();
  });

  it("renders SolvedDiagramView when diagram has solution", () => {
    mockHook.diagram = {
      id: 1,
      name: "A",
      definition: "1".repeat(81),
      solution: "123456789".repeat(9),
      created_at: new Date().toISOString(),
    };
    render(<EditorPanel />);
    expect(screen.getByText(/solution/i)).toBeInTheDocument();
  });

  it("propagates content changes via updateContent (name and definition)", async () => {
    const user = userEvent.setup();
    mockHook.diagram = {
      id: 1,
      name: "A",
      definition: "B".repeat(81),
      solution: null,
      created_at: new Date().toISOString(),
    };
    render(<EditorPanel />);

    const name = screen.getByLabelText(/name/i) as HTMLInputElement;
    await user.type(name, "X");
    expect(mockHook.updateContent).toHaveBeenLastCalledWith(
      "AX",
      "B".repeat(81),
    );

    const def = screen.getByLabelText(/definition/i) as HTMLTextAreaElement;
    await user.type(def, "1\n2");
    // SudokuTextarea strips newlines on emit
    expect(mockHook.updateContent).toHaveBeenLastCalledWith(
      "AX",
      "B".repeat(81) + "12",
    );
  });

  it("calls onSave from hook when Save clicked", async () => {
    const user = userEvent.setup();
    mockHook.diagram = {
      id: 1,
      name: " A ",
      definition: "D".repeat(81),
      solution: null,
      created_at: new Date().toISOString(),
    };
    render(<EditorPanel />);

    const save = screen.getByRole("button", { name: /save/i });
    expect(save).toBeEnabled();
    await user.click(save);
    expect(mockHook.onSave).toHaveBeenCalled();
  });
});
