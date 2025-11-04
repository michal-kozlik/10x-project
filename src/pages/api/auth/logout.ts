import type { APIRoute } from "astro";

export const prerender = false;

export const POST: APIRoute = async ({ locals, cookies, request }) => {
  const { supabase } = locals;

  try {
    // Sign out using Supabase - this should handle cookie cleanup through setAll callback
    const { error } = await supabase.auth.signOut();

    if (error) {
      // Log logout error for debugging
      // eslint-disable-next-line no-console
      console.error("Logout error:", error);
    }

    // Manually delete all Supabase auth cookies as a safety measure
    // Parse all cookies from the request
    const cookieHeader = request.headers.get("Cookie") || "";
    const allCookies = cookieHeader.split(";").map((c) => c.trim());

    // Delete any cookie that starts with 'sb-'
    allCookies.forEach((cookieStr) => {
      const cookieName = cookieStr.split("=")[0];
      if (cookieName && cookieName.startsWith("sb-")) {
        cookies.delete(cookieName, { path: "/" });
      }
    });

    // Clear locals
    locals.session = null;
    locals.user = null;

    return new Response(
      JSON.stringify({
        success: true,
        message: "Wylogowano pomyślnie",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    // Log exception during logout for debugging
    // eslint-disable-next-line no-console
    console.error("Logout exception:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "Wystąpił błąd podczas wylogowywania",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};
