import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './',
  // 5173 is occupied by the local VS Code port proxy on this workstation.
  server: { port: 5174 },
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.indexOf('node_modules/three') !== -1 || id.indexOf('node_modules/@react-three') !== -1) {
            return 'three-vendor';
          }
          if (id.indexOf('node_modules/lucide-react') !== -1) {
            return 'lucide-vendor';
          }
        },
      },
    },
  },
});


