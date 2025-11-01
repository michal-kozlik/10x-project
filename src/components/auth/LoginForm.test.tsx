import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { server } from "@/test/mocks/server";
// Prevent importing real Supabase client (requires ENV). Provide a harmless stub.
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
import { LoginForm } from "./LoginForm";

// Mock toast API to assert UX feedback without rendering toasts
vi.mock("@/lib/toast", () => ({
  showToast: {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn(),
    dismiss: vi.fn(),
  },
}));
import { showToast } from "@/lib/toast";

// Control window.location side effects (assigning to href)
const originalLocation = window.location;
let currentHref = originalLocation.href;

beforeAll(() => {
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
      assign: vi.fn((val: string) => {
        currentHref = val;
      }),
      replace: vi.fn((val: string) => {
        currentHref = val;
      }),
    },
  });
});

afterAll(() => {
  Object.defineProperty(window, "location", {
    configurable: true,
    value: originalLocation,
  });
});

const fillAndSubmit = async ({
  email = "john@example.com",
  password = "Aa123456",
}: { email?: string; password?: string } = {}) => {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText(/e-mail/i), email);
  await user.type(screen.getByLabelText(/hasło/i), password);
  await user.click(screen.getByRole("button", { name: /zaloguj się/i }));
};

describe("LoginForm", () => {
  it("blokuje submit przy niepoprawnych danych (nie spełnia Zod) i pokazuje toast, bez wywołania fetch", async () => {
    const user = userEvent.setup();

    // Do not mock login endpoint -> onUnhandledRequest would fail if fetch occurred.
    // We expect NO fetch due to client-side validation blocking submit.
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    render(<LoginForm />);

    // Wypełnij tak, aby przejść natywną walidację HTML, ale nie spełnić schematu Zod
    await user.type(screen.getByLabelText(/e-mail/i), "john@example.com");
    await user.type(screen.getByLabelText(/hasło/i), "aaaaaaaa"); // brak wielkich liter i cyfry
    await user.click(screen.getByRole("button", { name: /zaloguj się/i }));

    // Toast informing about missing fields
    expect(showToast.error).toHaveBeenCalledWith("Wypełnij wymagane pola");

    // No network call should be performed
    expect(fetchSpy).not.toHaveBeenCalled();

    fetchSpy.mockRestore();
  });

  it("pokazuje komunikaty walidacji dla niepoprawnego email i słabego hasła", async () => {
    render(<LoginForm />);

    await fillAndSubmit({ email: "not-an-email", password: "aAaaaaaa" }); // 8 chars, lacks digit

    expect(
      await screen.findByText(/podaj poprawny adres e-mail/i),
    ).toBeVisible();
    expect(
      await screen.findByText(/użyj małej i wielkiej litery oraz cyfry/i),
    ).toBeVisible();
  });

  it("po poprawnym logowaniu pokazuje toast i przekierowuje na nextPath", async () => {
    server.use(
      http.post("/api/auth/login", async () => {
        return HttpResponse.json({ ok: true }, { status: 200 });
      }),
    );

    // Reset href tracking
    currentHref = originalLocation.href;

    render(<LoginForm nextPath="/app/board" />);

    await fillAndSubmit();

    await waitFor(() => {
      expect(showToast.success).toHaveBeenCalledWith("Zalogowano pomyślnie");
    });

    // Redirect applied
    expect(currentHref).toContain("/app/board");
  });

  it("przy błędzie z backendu pokazuje komunikat serwera i nie przekierowuje", async () => {
    const message = "Błąd logowania";
    server.use(
      http.post("/api/auth/login", async () => {
        return HttpResponse.json({ error: message }, { status: 401 });
      }),
    );

    // Reset href tracking
    currentHref = originalLocation.href;

    render(<LoginForm />);
    await fillAndSubmit();

    // Server error message visible in UI and toast invoked
    expect(await screen.findByText(message)).toBeVisible();
    expect(showToast.error).toHaveBeenCalledWith(message);

    // No redirect
    expect(currentHref).toBe(originalLocation.href);
  });

  it("ustawia aria-busy i disabled na przycisku w trakcie submitu", async () => {
    // Simulate a slower backend to capture loading state
    server.use(
      http.post("/api/auth/login", async () => {
        await new Promise((r) => setTimeout(r, 150));
        return HttpResponse.json({ ok: true }, { status: 200 });
      }),
    );

    render(<LoginForm />);

    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/e-mail/i), "john@example.com");
    await user.type(screen.getByLabelText(/hasło/i), "Aa123456");

    const button = screen.getByRole("button", { name: /zaloguj się/i });
    await user.click(button);

    // Immediately after click, button should be busy/disabled
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(button).toBeDisabled();

    // Wait for request to resolve to avoid leaking async work
    await waitFor(() =>
      expect(showToast.success).toHaveBeenCalledWith("Zalogowano pomyślnie"),
    );
  });

  it("renderuje informację o nextPath w nagłówku, gdy podane", () => {
    render(<LoginForm nextPath="/powrot" />);
    expect(
      screen.getByText(/Po zalogowaniu wrócisz do \/powrot/i),
    ).toBeInTheDocument();
  });
});
