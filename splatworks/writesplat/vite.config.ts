import { defineConfig } from 'vite';

export default defineConfig({
  base: '/splatworks/writesplat/',
  worker: {format: 'es'},
  build: {
    chunkSizeWarningLimit: 800,
  },
});
