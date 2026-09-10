import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { 'onnxruntime-web/dist': new URL('./node_modules/onnxruntime-web/dist', import.meta.url).pathname } },
  test: { environment: "jsdom", setupFiles: ["./src/test/setup.ts"], include: ["src/**/*.test.ts", "src/**/*.test.tsx"] },
});
