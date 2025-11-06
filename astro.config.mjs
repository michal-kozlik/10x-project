// @ts-check
import { defineConfig } from "astro/config";

import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import node from "@astrojs/node";

// Use environment variable for backend URL
// Docker: http://backend:8080 (internal container network)
// Dev: http://localhost:5149 (host machine)

const backendUrl =
  globalThis.process?.env?.BACKEND_URL ?? "http://localhost:5149";

// https://astro.build/config
export default defineConfig({
  output: "server",
  integrations: [react(), sitemap()],
  server: { port: 3000 },
  vite: {
    plugins: [tailwindcss()],
    server: {
      proxy: {
        // Proxy diagram-related API calls to .NET backend
        // Auth routes (/api/auth/*) will be handled by Astro
        "^/api/diagrams": {
          target: backendUrl,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ""),
        },
      },
    },
  },
  adapter: node({
    mode: "standalone",
  }),
});
