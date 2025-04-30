import type { Linter } from 'eslint'

export const javascript = {
  files: '*.cjs',
  rules: {
    '@typescript-eslint/no-var-requires': 'off', // Allow require() in CJS files
  },
} satisfies Linter.ConfigOverride
