import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SudokuTextarea } from "./SudokuTextarea";

const make81 = (ch = "1") => ch.repeat(81);

describe("SudokuTextarea", () => {
  it("formats 81-char value into 9 lines initially", () => {
    render(<SudokuTextarea value={make81("1")} onChange={() => {}} />);
    const textarea = screen.getByRole("textbox");
    const lines =
      textarea instanceof HTMLTextAreaElement ? textarea.value.split("\n") : [];
    expect(lines).toHaveLength(9);
    expect(lines.every((l) => l.length === 9)).toBe(true);
  });

  it("does not reformat non-81 length values", () => {
    render(<SudokuTextarea value={"123"} onChange={() => {}} />);
    const textarea = screen.getByRole("textbox") as HTMLTextAreaElement;
    expect(textarea.value).toBe("123");
  });

  it("strips newlines when emitting onChange", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<SudokuTextarea value={""} onChange={onChange} />);

    const textarea = screen.getByRole("textbox") as HTMLTextAreaElement;
    // Type a small grid with newlines
    await user.type(textarea, "12{enter}3");
    // Last emitted value should be without newlines
    expect(onChange).toHaveBeenLastCalledWith("123");
  });

  it("has rows=9 and spellCheck=false and monospace class", () => {
    render(<SudokuTextarea value={""} onChange={() => {}} />);
    const textarea = screen.getByRole("textbox") as HTMLTextAreaElement;
    expect(textarea).toHaveAttribute("rows", "9");
    expect(textarea).toHaveAttribute("spellcheck", "false");
    expect(textarea.className).toMatch(/font-mono/);
  });
});
