import { defineConfig } from 'vite';

export default defineConfig({
  base: '/splatworks/writesplat/',
  build: {
    chunkSizeWarningLimit: 800,
  },
});
