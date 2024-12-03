import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    'mp4box.all': 'entries/all.ts',
    'mp4box.simple': 'entries/simple.ts',
  },
  format: ['cjs', 'esm'],
  splitting: false,
  sourcemap: true,
  clean: true,
  dts: true,
});
