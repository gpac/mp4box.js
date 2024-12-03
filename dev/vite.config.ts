import { defineConfig } from 'vite';

export default defineConfig({
  optimizeDeps: {
    exclude: ['mp4box'],
  },
});
