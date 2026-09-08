import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const API_TARGET = process.env.VITE_API_PROXY_TARGET || "http://localhost:5000";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: 5173,
    // So components that call a bare "/api/..." path (not the absolute URL in
    // services/api.js) still reach the backend instead of the Vite dev server.
    proxy: {
      "/api": { target: API_TARGET, changeOrigin: true }
    }
  }
});
