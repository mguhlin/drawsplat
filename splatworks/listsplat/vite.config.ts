import { defineConfig } from 'vite';

export default defineConfig({
  base: '/splatworks/listsplat/',
  build: {
    chunkSizeWarningLimit: 800,
  },
});
