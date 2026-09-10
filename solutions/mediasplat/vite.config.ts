import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/solutions/mediasplat/",
  plugins: [react()],
  resolve: { alias: { 'onnxruntime-web/dist': new URL('./node_modules/onnxruntime-web/dist', import.meta.url).pathname } },
  worker: { format: 'es' },
  server: { headers: { "Cross-Origin-Opener-Policy": "same-origin", "Cross-Origin-Embedder-Policy": "require-corp" } },
  preview: { headers: { "Cross-Origin-Opener-Policy": "same-origin", "Cross-Origin-Embedder-Policy": "require-corp" } },
});
