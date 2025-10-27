import { defineMiddleware, sequence } from "astro:middleware";
import { supabaseClient } from "../db/supabase.client";

// Create server-side client in middleware
const auth = defineMiddleware(async (context, next) => {
  context.locals.supabase = supabaseClient;

  // Get session from Supabase using cookie
  const {
    data: { session },
  } = await supabaseClient.auth.getSession();

  context.locals.session = session;
  context.locals.user = session?.user ?? null;

  return next();
});

// Protected routes middleware
const protect = defineMiddleware(async ({ locals, redirect, url }, next) => {
  // Public routes that don't require auth
  const publicRoutes = ["/login", "/register", "/reset-password"];
  const isPublicRoute = publicRoutes.includes(url.pathname);

  // If not authenticated and trying to access protected route
  if (!locals.session && !isPublicRoute) {
    return redirect("/login?next=" + encodeURIComponent(url.pathname));
  }

  // If authenticated and trying to access auth routes
  if (locals.session && isPublicRoute) {
    return redirect("/app");
  }

  return next();
});

export const onRequest = sequence(auth, protect);
