import { defineConfig } from 'tsup';

const PUBLISH_TO_NPM = process.env.PUBLISH_MODE === 'true';

// IIFE build with globalName for tests
const iifeBuild = defineConfig({
  entry: { 'mp4box.all': 'entries/all.ts' },
  target: 'es2017',
  format: ['iife'],
  globalName: 'MP4Box',
  splitting: false,
  sourcemap: true,
  minify: true,
  clean: true,
  dts: false,
});

// CJS and ESM builds for distribution
const regularBuild = defineConfig({
  entry: {
    'mp4box.all': 'entries/all.ts',
    'mp4box.simple': 'entries/simple.ts',
  },
  target: 'es2022',
  format: ['cjs', 'esm'],
  splitting: false,
  sourcemap: true,
  minify: true,
  clean: PUBLISH_TO_NPM,
  dts: true,
});

const build: Array<typeof iifeBuild | typeof regularBuild> = [];
if (PUBLISH_TO_NPM) {
  build.push(regularBuild);
} else {
  build.push(iifeBuild, regularBuild);
}

export default build;
