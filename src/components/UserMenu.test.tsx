import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { UserMenu } from "@/components/UserMenu";
import { showToast } from "@/lib/toast";

// Mock showToast
vi.mock("@/lib/toast", () => ({
  showToast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock window.location
const mockLocation = {
  href: "",
};
vi.stubGlobal("location", mockLocation);

// Mock fetch
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

describe("UserMenu", () => {
  const testEmail = "test@example.com";
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
    window.location.href = "";
  });

  it("should render user email and logout button", () => {
    render(<UserMenu userEmail={testEmail} />);

    expect(screen.getByText(testEmail)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /wyloguj/i }),
    ).toBeInTheDocument();
  });

  it("handles successful logout", async () => {
    global.fetch = vi.fn().mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      }),
    );

    render(<UserMenu userEmail={testEmail} />);
    const logoutButton = screen.getByRole("button", { name: /wyloguj/i });

    await user.click(logoutButton);

    expect(global.fetch).toHaveBeenCalledWith("/api/auth/logout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    expect(showToast.success).toHaveBeenCalledWith("Wylogowano pomyślnie");
    expect(window.location.href).toBe("/login");
  });

  it("handles failed logout with server error", async () => {
    const errorMessage = "Nie udało się wylogować";
    global.fetch = vi.fn().mockImplementationOnce(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ success: false, message: errorMessage }),
      }),
    );

    render(<UserMenu userEmail={testEmail} />);
    await user.click(screen.getByRole("button", { name: /wyloguj/i }));

    expect(showToast.error).toHaveBeenCalledWith(errorMessage);
    expect(window.location.href).not.toBe("/login");
  });

  it("handles network error during logout", async () => {
    const errorMessage = "Nie udało się wylogować";
    global.fetch = vi.fn().mockRejectedValueOnce(new Error(errorMessage));

    render(<UserMenu userEmail={testEmail} />);
    await user.click(screen.getByRole("button", { name: /wyloguj/i }));

    expect(showToast.error).toHaveBeenCalledWith(errorMessage);
    expect(window.location.href).not.toBe("/login");
  });

  it("shows loading state during logout process", async () => {
    let resolvePromise: ((value: unknown) => void) | undefined;
    global.fetch = vi.fn().mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolvePromise = resolve;
        }),
    );
    // Use resolvePromise later
    void resolvePromise;

    render(<UserMenu userEmail={testEmail} />);
    const logoutButton = screen.getByRole("button", { name: /wyloguj/i });

    await user.click(logoutButton);
    expect(logoutButton).toHaveAttribute("disabled", "");
    expect(screen.getByText("Wylogowywanie...")).toBeInTheDocument();
  });
});
