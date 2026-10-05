import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Lets the Vite dev server proxy /api straight to the Express backend,
    // so VITE_API_URL can just be "/api" in development if you prefer that
    // over CORS. Not required - src/api/client.js works fine pointed
    // directly at http://localhost:5000/api too.
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: "dist",
    sourcemap: true,
  },
});