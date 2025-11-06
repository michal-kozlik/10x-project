import type { APIRoute } from "astro";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5149";

export const GET: APIRoute = async ({ params, locals }) => {
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

  // Build the backend URL
  const backendUrl = `${BACKEND_URL}/diagrams/${id}`;

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
      JSON.stringify({ error: "Failed to fetch diagram from backend" }),
      {
        status: 502,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }
};

export const PUT: APIRoute = async ({ params, request, locals }) => {
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
  const backendUrl = `${BACKEND_URL}/diagrams/${id}`;

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
      method: "PUT",
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
      JSON.stringify({ error: "Failed to update diagram on backend" }),
      {
        status: 502,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }
};

export const DELETE: APIRoute = async ({ params, locals }) => {
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

  // Build the backend URL
  const backendUrl = `${BACKEND_URL}/diagrams/${id}`;

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
      method: "DELETE",
      headers,
    });

    // DELETE might return empty body
    const contentType = response.headers.get("content-type");
    const data =
      contentType && contentType.includes("application/json")
        ? await response.json()
        : null;

    return new Response(data ? JSON.stringify(data) : null, {
      status: response.status,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch {
    return new Response(
      JSON.stringify({ error: "Failed to delete diagram on backend" }),
      {
        status: 502,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }
};
