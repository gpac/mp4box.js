import os from 'node:os';
import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    maxConcurrency: os.cpus().length,
    include: ['tests/**/*.test.ts'],
    setupFiles: ['tests/setup.ts'],
    typecheck: {
      tsconfig: './tsconfig.test.json',
    },
    coverage: {
      provider: 'v8',
      reporter: ['html-spa'],
      include: ['src/**/*.ts', 'entries/**/*.ts'],
    },
  },
});
