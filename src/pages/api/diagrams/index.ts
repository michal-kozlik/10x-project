import type { APIRoute } from "astro";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5149";

export const GET: APIRoute = async ({ request, locals }) => {
  const url = new URL(request.url);
  const queryParams = url.search; // Get all query parameters

  // Get the access token from the session
  const accessToken = locals.session?.access_token;

  // Build the backend URL
  const backendUrl = `${BACKEND_URL}/diagrams${queryParams}`;

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
      method: "GET",
      headers,
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
      JSON.stringify({ error: "Błąd podczas pobierania diagramów" }),
      {
        status: 502,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }
};

export const POST: APIRoute = async ({ request, locals }) => {
  // Get the access token from the session
  const accessToken = locals.session?.access_token;

  // Get the request body
  const body = await request.text();

  // Build the backend URL
  const backendUrl = `${BACKEND_URL}/diagrams`;

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
      JSON.stringify({ error: "Błąd podczas tworzenia diagramu" }),
      {
        status: 502,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }
};
