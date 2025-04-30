import type { Linter } from 'eslint'

import { extraneousDependenciesPatterns } from '../constants'

export const rules: Linter.RulesRecord = {
  'react/jsx-props-no-spreading': 'off',
  'unicorn/prefer-module': 'off',
  'import/no-extraneous-dependencies': [
    // Avoid importing devDependencies in production code
    'error',
    { devDependencies: [...extraneousDependenciesPatterns] },
  ],
}
