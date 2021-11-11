import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import { terser } from 'rollup-plugin-terser';

const libraryName = 'mp4box';

export default [
  {
    input: `src/${libraryName}.ts`,
    output: [
      {
        name: libraryName,
        file: `dist/${libraryName}.umd.js`,
        format: 'umd',
      },
      { file: `dist/${libraryName}.esm.js`, format: 'esm' },
      { file: `dist/${libraryName}.cjs`, format: 'cjs' },
    ],
    external: [],
    watch: {
      include: 'src/**',
    },
    plugins: [
      typescript({ rootDir: 'src', outDir: 'dist' }),
      resolve({
        rootDir: './src/**.ts',
      }),
    ],
  },
  {
    input: `src/${libraryName}.ts`,
    output: [
      {
        name: libraryName,
        file: `dist/${libraryName}.umd.min.js`,
        format: 'umd',
        sourcemap: true,
      },
      { file: `dist/${libraryName}.esm.min.js`, format: 'esm', sourcemap: true },
      { file: `dist/${libraryName}.min.cjs`, format: 'cjs', sourcemap: true },
    ],
    external: [],
    watch: {
      include: 'src/**',
    },
    plugins: [
      typescript({ rootDir: 'src', outDir: 'dist' }),
      resolve({
        rootDir: './src/**.ts',
      }),
      terser(),
    ],
  },
];
