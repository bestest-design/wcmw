import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 5555,
  },
  build: {
    outDir: 'dist',
  },
});
