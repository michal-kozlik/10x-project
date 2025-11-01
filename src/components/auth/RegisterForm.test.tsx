import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { server } from "@/test/mocks/server";
import { RegisterForm } from "./RegisterForm";

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
      assign: vi.fn((val: string) => (currentHref = val)),
      replace: vi.fn((val: string) => (currentHref = val)),
    },
  });
});

afterAll(() => {
  Object.defineProperty(window, "location", {
    configurable: true,
    value: originalLocation,
  });
});

async function fillForm({
  email,
  password,
  acceptTerms,
}: {
  email: string;
  password: string;
  acceptTerms?: boolean;
}) {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText(/e-mail/i), email);
  await user.type(screen.getByLabelText(/hasło/i), password);
  if (acceptTerms) {
    await user.click(
      screen.getByRole("checkbox", { name: /regulamin serwisu/i }),
    );
  }
  await user.click(screen.getByRole("button", { name: /załóż konto/i }));
}

describe("RegisterForm", () => {
  it("blokuje submit gdy nie zaznaczono akceptacji regulaminu (brak wywołania fetch)", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    render(<RegisterForm />);

    await fillForm({
      email: "john@example.com",
      password: "Aa123456",
      acceptTerms: false,
    });

    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it("dla needsConfirmation=true pokazuje kartę potwierdzenia i toast z wiadomością", async () => {
    server.use(
      http.post("/api/auth/signup", async () => {
        return HttpResponse.json(
          { needsConfirmation: true, message: "Sprawdź e-mail" },
          { status: 200 },
        );
      }),
    );

    render(<RegisterForm />);
    await fillForm({
      email: "john@example.com",
      password: "Aa123456",
      acceptTerms: true,
    });

    expect(
      await screen.findByTestId("register-confirmation"),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(showToast.success).toHaveBeenCalledWith("Sprawdź e-mail"),
    );
  });

  it("po sukcesie bez potwierdzenia pokazuje toast i przekierowuje do nextPath", async () => {
    server.use(
      http.post("/api/auth/signup", async () => {
        return HttpResponse.json({}, { status: 200 });
      }),
    );

    currentHref = originalLocation.href;
    render(<RegisterForm nextPath="/app" />);

    await fillForm({
      email: "john@example.com",
      password: "Aa123456",
      acceptTerms: true,
    });

    await waitFor(() =>
      expect(showToast.success).toHaveBeenCalledWith(
        "Konto utworzone pomyślnie",
      ),
    );
    expect(currentHref).toContain("/app");
  });

  it("pokazuje błąd serwera i nie przekierowuje", async () => {
    const message = "Błąd rejestracji";
    server.use(
      http.post("/api/auth/signup", async () => {
        return HttpResponse.json({ error: message }, { status: 400 });
      }),
    );

    currentHref = originalLocation.href;
    render(<RegisterForm />);

    await fillForm({
      email: "john@example.com",
      password: "Aa123456",
      acceptTerms: true,
    });

    expect(await screen.findByText(message)).toBeVisible();
    expect(showToast.error).toHaveBeenCalledWith(message);
    expect(currentHref).toBe(originalLocation.href);
  });

  it("ustawia aria-busy i disabled w trakcie submitu", async () => {
    server.use(
      http.post("/api/auth/signup", async () => {
        await new Promise((r) => setTimeout(r, 120));
        return HttpResponse.json({}, { status: 200 });
      }),
    );

    render(<RegisterForm />);
    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/e-mail/i), "john@example.com");
    await user.type(screen.getByLabelText(/hasło/i), "Aa123456");
    await user.click(
      screen.getByRole("checkbox", { name: /regulamin serwisu/i }),
    );

    const btn = screen.getByRole("button", { name: /załóż konto/i });
    await user.click(btn);

    expect(btn).toHaveAttribute("aria-busy", "true");
    expect(btn).toBeDisabled();

    await waitFor(() => expect(showToast.success).toHaveBeenCalled());
  });
});
