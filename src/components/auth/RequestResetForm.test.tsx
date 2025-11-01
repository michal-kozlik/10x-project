import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { server } from "@/test/mocks/server";
import { RequestResetForm } from "./RequestResetForm";

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

describe("RequestResetForm", () => {
  it("z walidacją: nie wysyła gdy email jest pusty (brak fetch)", async () => {
    const user = userEvent.setup();
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    render(<RequestResetForm />);

    await user.click(
      screen.getByRole("button", { name: /wyślij link do resetu/i }),
    );

    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it("wywołuje przekazany onSubmit (bez fetch)", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    render(<RequestResetForm onSubmit={onSubmit} />);

    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/e-mail/i), "john@example.com");
    await user.click(
      screen.getByRole("button", { name: /wyślij link do resetu/i }),
    );

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({ email: "john@example.com" }),
    );
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it("happy path bez onSubmit: pokazuje kartę sukcesu i toast", async () => {
    server.use(
      http.post("/api/auth/request-reset", async () => {
        return HttpResponse.json({}, { status: 200 });
      }),
    );

    render(<RequestResetForm />);

    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/e-mail/i), "john@example.com");
    await user.click(
      screen.getByRole("button", { name: /wyślij link do resetu/i }),
    );

    expect(
      await screen.findByTestId("request-reset-success-card"),
    ).toBeInTheDocument();
    await waitFor(() => expect(showToast.success).toHaveBeenCalled());
  });

  it("błąd backendu: pokazuje komunikat i toast error", async () => {
    const message = "Błąd podczas wysyłania linku";
    server.use(
      http.post("/api/auth/request-reset", async () => {
        return HttpResponse.json({ error: message }, { status: 400 });
      }),
    );

    render(<RequestResetForm />);

    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/e-mail/i), "john@example.com");
    await user.click(
      screen.getByRole("button", { name: /wyślij link do resetu/i }),
    );

    expect(await screen.findByText(message)).toBeVisible();
    expect(showToast.error).toHaveBeenCalledWith(message);
  });

  it("kliknięcie 'Wróć do logowania' wywołuje onLoginClick, gdy podany", async () => {
    const onLoginClick = vi.fn();
    server.use(
      http.post("/api/auth/request-reset", async () => {
        return HttpResponse.json({}, { status: 200 });
      }),
    );

    render(<RequestResetForm onLoginClick={onLoginClick} />);

    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/e-mail/i), "john@example.com");
    await user.click(
      screen.getByRole("button", { name: /wyślij link do resetu/i }),
    );

    // po sukcesie widzimy link
    const link = await screen.findByRole("link", {
      name: /wrócić do logowania/i,
    });
    await user.click(link);

    expect(onLoginClick).toHaveBeenCalled();
  });
});
