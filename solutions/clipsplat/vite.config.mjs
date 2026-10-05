export default {
  base: '/solutions/clipsplat/',
  worker: { format: 'es' },
  build: { outDir: 'dist', rollupOptions: { input: 'index.vite.html' } },
};
