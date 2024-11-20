import { resolve } from 'path';
import { defineConfig } from 'vite';
import dtsBundleGenerator from 'vite-plugin-dts-bundle-generator';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [
    tsconfigPaths(),
    dtsBundleGenerator(
      {
        fileName: name => `${name}.d.ts`,
        libraries: {
          importedLibraries: [],
        },
        output: {
          sortNodes: true, // Helps in maintaining the order but check if additional flags are necessary
        },
      },
      {
        preferredConfigPath: './tsconfig.json',
      },
    ),
  ],
  server: { port: 3000 },
  build: {
    target: 'esnext',
    minify: false,
    lib: {
      entry: {
        all: resolve(__dirname, 'entries/all.ts'),
        simple: resolve(__dirname, 'entries/simple.ts'),
      },
      name: 'repl',
      fileName: (format, name) => `${name}.${format === 'es' ? 'js' : 'cjs'}`,
      formats: ['es', 'cjs'],
    },
  },
  css: {
    modules: {
      generateScopedName: '[name]__[local]___[hash:base64:5]',
    },
  },
});
