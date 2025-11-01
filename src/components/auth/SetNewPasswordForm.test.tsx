/* eslint-disable prettier/prettier */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SetNewPasswordForm } from "./SetNewPasswordForm";

vi.mock("@/db/supabase.client", () => ({
  supabaseClient: {
    auth: {
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
    },
  },
}));

vi.mock("@/lib/toast", () => ({
  showToast: {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn(),
    dismiss: vi.fn(),
  },
}));
import { showToast } from "@/lib/toast";

const originalLocation = window.location;
let currentHref = originalLocation.href;

beforeEach(() => {
  Object.defineProperty(window, "location", {
    configurable: true,
    value: {
      ...originalLocation,
      get href() {
        return currentHref;
      },
      set href(val: string) {
        currentHref = val;
      },
      assign: vi.fn((val: string) => (currentHref = val)),
      replace: vi.fn((val: string) => (currentHref = val)),
    },
  });
  currentHref = originalLocation.href;
});

afterEach(() => {
  Object.defineProperty(window, "location", {
    configurable: true,
    value: originalLocation,
  });
});

describe("SetNewPasswordForm", () => {
  it("mismatch haseł blokuje submit: toast i brak fetch", async () => {
    const user = userEvent.setup();
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    render(<SetNewPasswordForm />);

    await user.type(screen.getByLabelText(/^nowe hasło$/i), "Aa123456");
    await user.type(screen.getByLabelText(/^potwierdź nowe hasło$/i), "Aa12345x");
    await user.click(screen.getByRole("button", { name: /ustaw nowe hasło/i }));

    expect(showToast.error).toHaveBeenCalledWith("Wypełnij wymagane pola");
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

    it("wywołuje przekazany onSubmit (bez fetch)", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    render(<SetNewPasswordForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText(/^nowe hasło$/i), "Aa123456");
    await user.type(screen.getByLabelText(/^potwierdź nowe hasło$/i), "Aa123456");
    await user.click(screen.getByRole("button", { name: /ustaw nowe hasło/i }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ password: "Aa123456", confirmPassword: "Aa123456" }));
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });
});
