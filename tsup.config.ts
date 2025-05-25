import { defineConfig } from 'tsup';

export default [
  // IIFE build with globalName
  defineConfig({
    entry: { 'mp4box.all': 'entries/all.ts' },
    target: 'es2017',
    format: ['iife'],
    globalName: 'MP4Box',
    splitting: false,
    sourcemap: true,
    clean: true,
    dts: false,
  }),
  // CJS and ESM builds without globalName
  defineConfig({
    entry: {
      'mp4box.all': 'entries/all.ts',
      'mp4box.simple': 'entries/simple.ts',
    },
    target: 'es2022',
    format: ['cjs', 'esm'],
    splitting: false,
    sourcemap: true,
    clean: false, // Already cleaned above
    dts: true, // Generate DTS here
  }),
];
