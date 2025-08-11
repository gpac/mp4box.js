import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintPrettier from 'eslint-plugin-prettier/recommended';
import eslintUnicorn from 'eslint-plugin-unicorn';

export default tseslint.config(
  { ignores: ['dist', '**/*.{mjs,js}', '*.ts'] },
  { plugins: { unicorn: eslintUnicorn } },
  { languageOptions: { parserOptions: { projectService: true } } },
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
      // Only allow Error objects to be thrown
      'no-throw-literal': 'error',
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
      // Consistent use of undefined
      'unicorn/no-null': 'error',
      '@typescript-eslint/no-restricted-types': [
        'error',
        {
          types: {
            null: {
              message: 'Use undefined instead of null',
              fixWith: 'undefined',
            },
          },
        },
      ],
      '@typescript-eslint/no-inferrable-types': 'error',
      'no-useless-return': 'error',
      '@typescript-eslint/no-redundant-type-constituents': 'error',
    },
  },
  eslintPrettier,
);
