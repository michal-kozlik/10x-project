import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SudokuEditor } from "./SudokuEditor";
import type { DiagramDTO } from "@/types";

describe("SudokuEditor", () => {
  const baseDiagram: DiagramDTO = {
    id: 1,
    name: "My Diagram",
    definition: "1".repeat(81),
    solution: null,
    created_at: new Date().toISOString(),
  };

  it("trims name on save and passes definition", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(
      <SudokuEditor
        diagram={baseDiagram}
        isDirty={true}
        validationErrors={[]}
        onSave={onSave}
        onSolve={vi.fn()}
        onClear={vi.fn()}
      />,
    );

    const nameInput = screen.getByLabelText(/nazwa/i) as HTMLInputElement;
    await user.clear(nameInput);
    await user.type(nameInput, "  Foo  ");

    const save = screen.getByRole("button", { name: /zapisz/i });
    await user.click(save);

    expect(onSave).toHaveBeenCalledWith({
      name: "Foo",
      definition: baseDiagram.definition,
    });
  });

  it("solve is enabled only when diagram.id exists and calls onSolve with id", async () => {
    const user = userEvent.setup();
    const onSolve = vi.fn();
    // Test with null diagram first (no id)
    const { rerender } = render(
      <SudokuEditor
        diagram={null}
        isDirty={true}
        validationErrors={[]}
        onSave={vi.fn()}
        onSolve={onSolve}
        onClear={vi.fn()}
      />,
    );

    let solve = screen.getByRole("button", { name: /rozwiąż/i });
    expect(solve).toBeDisabled();

    rerender(
      <SudokuEditor
        diagram={baseDiagram}
        isDirty={true}
        validationErrors={[]}
        onSave={vi.fn()}
        onSolve={onSolve}
        onClear={vi.fn()}
      />,
    );

    solve = screen.getByRole("button", { name: /rozwiąż/i });
    expect(solve).toBeEnabled();
    await user.click(solve);
    expect(onSolve).toHaveBeenCalledWith(baseDiagram.id);
  });

  it("disables Save when not dirty or when there are validation errors", () => {
    const { rerender } = render(
      <SudokuEditor
        diagram={baseDiagram}
        isDirty={false}
        validationErrors={[]}
        onSave={vi.fn()}
        onSolve={vi.fn()}
        onClear={vi.fn()}
      />,
    );
    let save = screen.getByRole("button", { name: /zapisz/i });
    expect(save).toBeDisabled();

    rerender(
      <SudokuEditor
        diagram={baseDiagram}
        isDirty={true}
        validationErrors={["Err"]}
        onSave={vi.fn()}
        onSolve={vi.fn()}
        onClear={vi.fn()}
      />,
    );
    save = screen.getByRole("button", { name: /zapisz/i });
    expect(save).toBeDisabled();
  });

  it("calls onContentChange with paired values when name or definition changes", async () => {
    const user = userEvent.setup();
    const onContentChange = vi.fn();
    render(
      <SudokuEditor
        diagram={{
          id: 2,
          name: "A",
          definition: "B".repeat(81),
          solution: null,
          created_at: new Date().toISOString(),
        }}
        isDirty={true}
        validationErrors={[]}
        onSave={vi.fn()}
        onSolve={vi.fn()}
        onClear={vi.fn()}
        onContentChange={onContentChange}
      />,
    );

    const nameInput = screen.getByLabelText(/nazwa/i) as HTMLInputElement;
    await user.type(nameInput, "X");
    expect(onContentChange).toHaveBeenLastCalledWith("AX", "B".repeat(81));

    const definition = screen.getByLabelText(
      /definicja/i,
    ) as HTMLTextAreaElement;
    await user.type(definition, "1");
    // SudokuTextarea removes newlines on emit, but here we only typed one char append
    expect(onContentChange).toHaveBeenLastCalledWith(
      "AX",
      "B".repeat(81) + "1",
    );
  });

  it("updates inputs when diagram prop changes", () => {
    const { rerender } = render(
      <SudokuEditor
        diagram={{
          id: 1,
          name: "Old",
          definition: "1".repeat(81),
          solution: null,
          created_at: new Date().toISOString(),
        }}
        isDirty={false}
        validationErrors={[]}
        onSave={vi.fn()}
        onSolve={vi.fn()}
        onClear={vi.fn()}
      />,
    );

    expect((screen.getByLabelText(/nazwa/i) as HTMLInputElement).value).toBe(
      "Old",
    );

    rerender(
      <SudokuEditor
        diagram={{
          id: 1,
          name: "New",
          definition: "2".repeat(81),
          solution: null,
          created_at: new Date().toISOString(),
        }}
        isDirty={false}
        validationErrors={[]}
        onSave={vi.fn()}
        onSolve={vi.fn()}
        onClear={vi.fn()}
      />,
    );

    expect((screen.getByLabelText(/nazwa/i) as HTMLInputElement).value).toBe(
      "New",
    );
  });
});
