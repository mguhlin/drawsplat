import { defineConfig, type Connect } from "vite";
import react from "@vitejs/plugin-react";
import { createReadStream } from "node:fs";

// Production serves this shared engine beside VideoSplat. Serve the same files
// locally so Firefox workers can load them without browser request interception.
const sharedFfmpeg: Connect.NextHandleFunction = (request, response, next) => {
  const name = request.url?.split("?")[0]?.match(/^\/solutions\/mediasplat\/ffmpeg\/(ffmpeg-core\.(?:js|part-0[12]))$/)?.[1];
  if (!name) return next();
  response.setHeader("Content-Type", name.endsWith(".js") ? "text/javascript" : "application/octet-stream");
  const file = createReadStream(new URL(`../mediasplat/ffmpeg/${name}`, import.meta.url));
  file.on("error", () => { response.statusCode = 404; response.end(); });
  file.pipe(response);
};

export default defineConfig({
  base: "/solutions/videosplat/",
  plugins: [react(), {
    name: "shared-ffmpeg",
    configureServer(server) { server.middlewares.use(sharedFfmpeg); },
    configurePreviewServer(server) { server.middlewares.use(sharedFfmpeg); },
  }],
  resolve: { alias: { 'onnxruntime-web/dist': new URL('./node_modules/onnxruntime-web/dist', import.meta.url).pathname } },
  worker: { format: 'es' },
  server: { headers: { "Cross-Origin-Opener-Policy": "same-origin", "Cross-Origin-Embedder-Policy": "require-corp" } },
  preview: { headers: { "Content-Security-Policy": "default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data:; media-src 'self' blob:; connect-src 'self' blob: https://huggingface.co https://*.huggingface.co https://*.xethub.hf.co https://*.cdn.hf.co; worker-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'self'", "Cross-Origin-Opener-Policy": "same-origin", "Cross-Origin-Embedder-Policy": "require-corp" } },
});
