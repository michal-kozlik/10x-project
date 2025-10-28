import type { AstroCookies } from "astro";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "./database.types";

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_KEY;

// Client instance (for client-side components)
export const supabaseClient = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
);
export type SupabaseClient = typeof supabaseClient;

function parseCookieHeader(
  cookieHeader: string,
): { name: string; value: string }[] {
  return cookieHeader.split(";").map((cookie) => {
    const [name, ...rest] = cookie.trim().split("=");
    return { name, value: rest.join("=") };
  });
}

export const createSupabaseServerInstance = (context: {
  headers: Headers;
  cookies: AstroCookies;
}) => {
  const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return parseCookieHeader(context.headers.get("Cookie") ?? "");
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          // Use secure cookies only in production (when using HTTPS)
          // In development, we use HTTP, so secure must be false
          const isProduction = import.meta.env.PROD;
          const cookieOptions = {
            ...options,
            secure: isProduction,
            httpOnly: true,
            sameSite: "lax" as const,
            path: "/",
          };
          context.cookies.set(name, value, cookieOptions);
        });
      },
    },
  });

  return supabase;
};
