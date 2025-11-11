import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PrimaryActions } from "./PrimaryActions";

describe("PrimaryActions", () => {
  it("disables Solve when canSolve is false and enables when true", async () => {
    const user = userEvent.setup();
    const onSolve = vi.fn();

    const { rerender } = render(
      <PrimaryActions
        canSave={false}
        canSolve={false}
        isSaveEnabled={false}
        onSave={vi.fn()}
        onSolve={onSolve}
        onClear={vi.fn()}
        onExample={vi.fn()}
      />,
    );

    const solve = screen.getByRole("button", { name: /rozwiąż/i });
    expect(solve).toBeDisabled();
    await user.click(solve);
    expect(onSolve).not.toHaveBeenCalled();

    rerender(
      <PrimaryActions
        canSave={false}
        canSolve={true}
        isSaveEnabled={false}
        onSave={vi.fn()}
        onSolve={onSolve}
        onClear={vi.fn()}
        onExample={vi.fn()}
      />,
    );

    const solveEnabled = screen.getByRole("button", { name: /rozwiąż/i });
    expect(solveEnabled).toBeEnabled();
    await user.click(solveEnabled);
    expect(onSolve).toHaveBeenCalledTimes(1);
  });

  it("disables Save when canSave is false or isSaveEnabled is false", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();

    const { rerender } = render(
      <PrimaryActions
        canSave={false}
        canSolve={false}
        isSaveEnabled={true}
        onSave={onSave}
        onSolve={vi.fn()}
        onClear={vi.fn()}
        onExample={vi.fn()}
      />,
    );

    let save = screen.getByRole("button", { name: /zapisz/i });
    expect(save).toBeDisabled();
    await user.click(save);
    expect(onSave).not.toHaveBeenCalled();

    rerender(
      <PrimaryActions
        canSave={true}
        canSolve={false}
        isSaveEnabled={false}
        onSave={onSave}
        onSolve={vi.fn()}
        onClear={vi.fn()}
        onExample={vi.fn()}
      />,
    );

    save = screen.getByRole("button", { name: /zapisz/i });
    expect(save).toBeDisabled();

    rerender(
      <PrimaryActions
        canSave={true}
        canSolve={false}
        isSaveEnabled={true}
        onSave={onSave}
        onSolve={vi.fn()}
        onClear={vi.fn()}
        onExample={vi.fn()}
      />,
    );

    save = screen.getByRole("button", { name: /zapisz/i });
    expect(save).toBeEnabled();
    await user.click(save);
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it("always allows Clear and calls onClear on click", async () => {
    const user = userEvent.setup();
    const onClear = vi.fn();

    render(
      <PrimaryActions
        canSave={false}
        canSolve={false}
        isSaveEnabled={false}
        onSave={vi.fn()}
        onSolve={vi.fn()}
        onClear={onClear}
        onExample={vi.fn()}
      />,
    );

    const clear = screen.getByRole("button", { name: /czyść/i });
    expect(clear).toBeEnabled();
    await user.click(clear);
    expect(onClear).toHaveBeenCalledTimes(1);
  });
});
