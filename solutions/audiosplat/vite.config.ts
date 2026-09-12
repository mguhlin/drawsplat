import { defineConfig } from 'vite';

export default defineConfig({
  base: '/solutions/audiosplat/',
  resolve: { alias: { 'onnxruntime-web/dist': new URL('./node_modules/onnxruntime-web/dist', import.meta.url).pathname } },
  worker: { format: 'es' },
  build: { outDir: 'dist', emptyOutDir: true },
});
