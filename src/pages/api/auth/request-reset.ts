import type { APIRoute } from "astro";
import { createSupabaseServerInstance } from "../../../db/supabase.client";
import { z } from "zod";

const requestResetSchema = z.object({
  email: z.string().email("Invalid email format"),
});

export const prerender = false;

export const POST: APIRoute = async (context) => {
  const { request, cookies, url } = context;

  try {
    const body = await request.json();
    const { email } = requestResetSchema.parse(body);

    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
    });

    // Construct the redirect URL for password reset
    const redirectTo = `${url.origin}/reset-password`;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Always return success to prevent email enumeration attacks
    return new Response(
      JSON.stringify({
        message:
          "Jeśli konto dla podanego adresu istnieje, wyślemy na niego link do resetowania hasła.",
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({ error: "Nieprawidłowy format adresu e-mail" }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    return new Response(
      JSON.stringify({ error: "Wystąpił nieoczekiwany błąd" }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
};
