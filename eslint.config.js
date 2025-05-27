import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintPlugin from 'eslint-plugin-prettier/recommended';

export default tseslint.config(
  { ignores: ['dist', '**/*.{mjs,js}'] },
  eslint.configs.recommended,

  tseslint.configs.strict,
  tseslint.configs.stylistic,
  {
    rules: {
      // Override no-unused-vars to allow unused variables that start with an underscore
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      // Disable the base rule 'no-unused-vars' to avoid conflicts with TypeScript's rule
      'no-unused-vars': 'off',
      // Disable @typescript-eslint/prefer-for-of we have too much for now
      '@typescript-eslint/prefer-for-of': 'off',
      // Prefer to use Array<T> over T[]
      '@typescript-eslint/array-type': ['error', { default: 'generic' }],
      // Use interfaces for object type definitions
      '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
      // Don't require curly braces for simple if statements
      curly: ['error', 'multi-line'],
      // Enforce strict equality checks
      eqeqeq: 'error',
    },
  },
  eslintPlugin,
);
