import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    all: 'entries/all.ts',
    simple: 'entries/simple.ts',
  },
  format: ['cjs', 'esm'],
  splitting: false,
  sourcemap: true,
  clean: true,
  dts: true,
});
