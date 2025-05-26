import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist', '**/*.js'] },
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
    },
  },
);
