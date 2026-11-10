import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Relative base so the build works at any GitHub Pages path (e.g. /salesforce-vs-hubspot-cbs/).
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 1400,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // React gets its own chunk so the 3D chunks (which depend on it) stay lazy.
          if (/node_modules\/(react|react-dom|scheduler|@babel\/runtime)\//.test(id) || id.includes('vite/preload-helper')) return 'react';
          if (id.includes('node_modules/three/')) return 'three';
          if (id.includes('@react-three') || id.includes('postprocessing')) return 'r3f';
          if (id.includes('lenis')) return 'scroll';
        },
      },
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'tests/**/*.test.ts'],
  },
});
