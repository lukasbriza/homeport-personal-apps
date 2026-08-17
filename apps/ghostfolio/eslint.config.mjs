import tseslint from 'typescript-eslint'
import nestjsConfig from '@lukasbriza/eslint-config/nestjs'

/** @type {import('eslint').Linter.Config[]} */
export default tseslint.config(
  ...nestjsConfig,
  {
    languageOptions: { parserOptions: { tsconfigRootDir: import.meta.dirname } },
    rules: {
      'no-magic-numbers': 'off',
      'lines-between-class-members': [
        'error',
        { enforce: [{ blankLine: 'always', prev: 'method', next: 'method' }] },
      ],
    },
  },
  {
    files: ['**/*.spec.ts', '**/*.test.ts'],
    rules: { 'import/no-extraneous-dependencies': 'off' },
  },
)
