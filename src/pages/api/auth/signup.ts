import type { APIRoute } from "astro";
import { createSupabaseServerInstance } from "../../../db/supabase.client";
import { z } from "zod";

const signupSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const prerender = false;

export const POST: APIRoute = async (context) => {
  const { request, cookies } = context;

  try {
    const body = await request.json();
    const { email, password } = signupSchema.parse(body);

    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
    });

    // Sign up the user with Supabase Auth
    // Email confirmation is enabled by default in Supabase
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // Redirect to the app after email confirmation
        emailRedirectTo: `${new URL(request.url).origin}/app`,
      },
    });

    if (error) {
      return new Response(
        JSON.stringify({
          code: "SIGNUP_ERROR",
          error: error.message,
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
    }

    // Check if email confirmation is required
    const needsConfirmation = data.user && !data.session;

    return new Response(
      JSON.stringify({
        user: data.user,
        needsConfirmation,
        message: needsConfirmation
          ? "Sprawdź swoją skrzynkę e-mail i kliknij link potwierdzający, aby aktywować konto."
          : "Konto zostało utworzone pomyślnie.",
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({
          code: "VALIDATION_ERROR",
          error: "Nieprawidłowe dane formularza",
          details: error.errors,
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
    }

    return new Response(
      JSON.stringify({
        code: "INTERNAL_ERROR",
        error: "Wystąpił błąd serwera",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }
};
