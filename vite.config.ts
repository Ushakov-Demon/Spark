import { defineConfig } from 'vite';

// The web lab lives in web/; the engine in src/ is imported directly.
export default defineConfig({
  root: 'web',
  base: './',
  build: { outDir: '../dist-web', emptyOutDir: true },
  server: { open: true },
});
