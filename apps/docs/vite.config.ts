import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "dist"
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


