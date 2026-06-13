import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  base: '/gridsplat/',
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react')) {
            return 'react';
          }

          if (id.includes('node_modules/chart.js')) {
            return 'charts';
          }

          if (id.includes('node_modules/hyperformula')) {
            return 'formulas';
          }

          if (id.includes('node_modules/exceljs')) {
            return 'excel';
          }

          return undefined;
        },
      },
    },
  },
  plugins: [react()],
});
