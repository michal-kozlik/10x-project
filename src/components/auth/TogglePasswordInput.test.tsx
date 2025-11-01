import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TogglePasswordInput } from "./TogglePasswordInput";

describe("TogglePasswordInput", () => {
  it("przełącza typ inputa między password i text oraz aria-label ikony", async () => {
    const user = userEvent.setup();
    render(<TogglePasswordInput placeholder="Hasło" />);

    const input = screen.getByPlaceholderText("Hasło") as HTMLInputElement;
    // initial type
    expect(input.type).toBe("password");

    // button with icon
    const btn = screen.getByRole("button", { name: /show password/i });
    await user.click(btn);

    expect(input.type).toBe("text");
    expect(
      screen.getByRole("button", { name: /hide password/i }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /hide password/i }));
    expect(input.type).toBe("password");
  });

  it("przekazuje propsy do pola Input (placeholder)", () => {
    render(<TogglePasswordInput placeholder="Sekret" />);
    expect(screen.getByPlaceholderText("Sekret")).toBeInTheDocument();
  });
});
