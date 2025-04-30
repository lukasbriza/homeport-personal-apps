import type { Linter } from 'eslint'

export const unicorn: Linter.RulesRecord = {
  'unicorn/no-array-callback-reference': 'off', // Allow array callbacks to use the array reference
  'unicorn/no-nested-ternary': 'off', // We use ESLint's `no-nested-ternary` rule instead
  'unicorn/no-null': 'off', // Allow null values
  'unicorn/prevent-abbreviations': [
    // Disallow abbreviations where they are not helpful
    'error',
    {
      replacements: {
        args: {
          arguments: false,
        },
        docs: {
          documents: false,
          documentation: false,
        },
        params: {
          parameters: false,
        },
        prop: {
          property: false,
        },
        props: {
          properties: false,
        },
        ref: {
          reference: false,
        },
      },
    },
  ],
}
