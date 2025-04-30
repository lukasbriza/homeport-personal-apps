import type { Linter } from 'eslint'

export = {
  extends: [require.resolve('./base')],
  rules: {
    'unicorn/prefer-module': 'off',
  },
} satisfies Linter.Config
