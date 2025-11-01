import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { AuthCard, TogglePasswordInput } from "./AuthCard";

vi.mock("@/db/supabase.client", () => ({
  supabaseClient: {
    auth: {
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      getSession: vi
        .fn()
        .mockResolvedValue({ data: { session: null }, error: null }),
    },
  },
}));

// Smoke for toast importers if any child uses it indirectly
vi.mock("@/lib/toast", () => ({
  showToast: {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn(),
    dismiss: vi.fn(),
  },
}));

describe("AuthCard", () => {
  it("renderuje title, subtitle i footer", () => {
    render(
      <AuthCard title="T" subtitle="S" footer={<div data-testid="F">F</div>}>
        <div>Child</div>
      </AuthCard>,
    );

    expect(screen.getByText("T")).toBeInTheDocument();
    expect(screen.getByText("S")).toBeInTheDocument();
    expect(screen.getByTestId("F")).toBeInTheDocument();
    expect(screen.getByText("Child")).toBeInTheDocument();
  });

  it("z onSubmit opakowuje dzieci w form i woła callback przy submit", async () => {
    const onSubmit = vi.fn((e: React.FormEvent<HTMLFormElement>) =>
      e.preventDefault(),
    );

    render(
      <AuthCard title="Form" onSubmit={onSubmit}>
        <button type="submit">Wyślij</button>
      </AuthCard>,
    );

    await screen.findByText("Wyślij");
    (await screen.findByText("Wyślij")).dispatchEvent(
      new MouseEvent("click", { bubbles: true }),
    );

    expect(onSubmit).toHaveBeenCalled();
  });

  it("re-eksportuje TogglePasswordInput (smoke)", () => {
    render(<TogglePasswordInput placeholder="Hasło" />);
    expect(screen.getByPlaceholderText("Hasło")).toBeInTheDocument();
  });
});
