import type { Linter } from 'eslint'

import { getImportExtensionsRule } from '../../utils'

export const imports: Linter.RulesRecord = {
  ...getImportExtensionsRule(),
  'import/order': [
    // Sort and group imports by type
    'error',
    {
      alphabetize: {
        caseInsensitive: true,
        order: 'asc',
      },
      groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
      'newlines-between': 'always',
    },
  ],
  'import/prefer-default-export': 'off', // Prefer named exports
  'unused-imports/no-unused-imports': 'error', // Disallow unused imports
  'unused-imports/no-unused-vars': ['error', { ignoreRestSiblings: true }], // Disallow unused variables
}
