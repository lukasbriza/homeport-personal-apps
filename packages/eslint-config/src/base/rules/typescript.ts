import type { Linter } from 'eslint'

export const typescript: Linter.RulesRecord = {
  '@typescript-eslint/no-unused-vars': 'off', // Guarded by eslint-plugin-unused-imports
  '@typescript-eslint/no-use-before-define': 'error', // Disallow usage of variables before their declaration
}
