import type { APIRoute } from "astro";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5149";

export const POST: APIRoute = async ({ params, request, locals }) => {
  const { id } = params;

  if (!id) {
    return new Response(JSON.stringify({ error: "Diagram ID is required" }), {
      status: 400,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  // Get the access token from the session
  const accessToken = locals.session?.access_token;

  // Get the request body
  const body = await request.text();

  // Build the backend URL
  const backendUrl = `${BACKEND_URL}/diagrams/${id}/solve`;

  // Forward the request to the backend
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  // Add authorization header if user is authenticated
  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  try {
    const response = await fetch(backendUrl, {
      method: "POST",
      headers,
      body,
    });

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch {
    return new Response(
      JSON.stringify({ error: "Failed to solve diagram on backend" }),
      {
        status: 502,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }
};
