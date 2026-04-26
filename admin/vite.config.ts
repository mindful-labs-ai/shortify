import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const SIDECAR = process.env.SHORTIFY_SIDECAR_URL ?? "http://127.0.0.1:51234";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 1421, // main app uses 1420
    strictPort: true,
    proxy: {
      "/admin": {
        target: SIDECAR,
        changeOrigin: true,
      },
    },
  },
});
