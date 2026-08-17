import tseslint from 'typescript-eslint'

import { base } from './base.mjs'

export const nestjsConfig = tseslint.config(
  ...base,
  {
    rules: {
      'class-methods-use-this': 'off',
      'no-empty-function': ['error', { allow: ['constructors'] }],
      'unicorn/prefer-module': 'off',
      'unicorn/prefer-top-level-await': 'off',
    },
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      '@typescript-eslint/consistent-type-imports': 'off',
      '@typescript-eslint/no-extraneous-class': ['error', { allowWithDecorator: true }],
    },
  },
  { files: ['**/modules/*/models/*.ts'], rules: { 'import/no-cycle': 'off' } },
)

export default nestjsConfig
