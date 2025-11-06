import { defineMiddleware, sequence } from "astro:middleware";
import { createSupabaseServerInstance } from "../db/supabase.client";

// Create server-side client in middleware
const auth = defineMiddleware(async (context, next) => {
  const supabase = createSupabaseServerInstance({
    cookies: context.cookies,
    headers: context.request.headers,
  });

  // Make supabase client available in routes
  context.locals.supabase = supabase;

  try {
    // Get session from Supabase using cookie
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();
    if (error) throw error;

    context.locals.session = session;
    context.locals.user = session?.user ?? null;
  } catch {
    // Failed to get session - clear locals to ensure we don't leak state
    context.locals.session = null;
    context.locals.user = null;
  }

  return next();
});

// Protected routes middleware
const protect = defineMiddleware(async ({ locals, redirect, url }, next) => {
  // Skip protection for API routes - they should handle auth themselves
  if (url.pathname.startsWith("/api/")) {
    return next();
  }

  // Public routes that don't require auth
  const publicRoutes = ["/login", "/register", "/reset-password"];
  const isPublicRoute = publicRoutes.includes(url.pathname);

  // If not authenticated and trying to access protected route
  if (!locals.session?.user && !isPublicRoute) {
    return redirect(
      "/login?next=" + encodeURIComponent(url.pathname),
      302, // Use temporary redirect
    );
  }

  // If authenticated and trying to access login/register pages, redirect to app
  const authPages = ["/login", "/register"];
  if (locals.session?.user && authPages.includes(url.pathname)) {
    return redirect("/app", 302); // Use temporary redirect
  }

  // Pass-through for all other routes
  return next();
});

export const onRequest = sequence(auth, protect);
