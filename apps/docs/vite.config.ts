import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  build: {
    // Output to repo root so Vercel (and other hosts) can consistently detect `dist/`
    // even when deploying from a monorepo.
    outDir: path.resolve(__dirname, "../../dist"),
    emptyOutDir: true
  },
  resolve: {
    alias: {
      // Use source during docs dev, so we don't require a pre-built dist/.
      "marshmallow-icons": path.resolve(
        __dirname,
        "../../packages/icons/src/index.ts"
      )
    }
  },
  server: {
    port: 5173
  }
});


