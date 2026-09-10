import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/solutions/videosplat/",
  plugins: [react()],
  resolve: { alias: { 'onnxruntime-web/dist': new URL('./node_modules/onnxruntime-web/dist', import.meta.url).pathname } },
  worker: { format: 'es' },
  server: { headers: { "Cross-Origin-Opener-Policy": "same-origin", "Cross-Origin-Embedder-Policy": "require-corp" } },
  preview: { headers: { "Content-Security-Policy": "default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data:; media-src 'self' blob:; connect-src 'self' blob: https://huggingface.co https://*.huggingface.co https://*.xethub.hf.co https://*.cdn.hf.co; worker-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'self'", "Cross-Origin-Opener-Policy": "same-origin", "Cross-Origin-Embedder-Policy": "require-corp" } },
});
