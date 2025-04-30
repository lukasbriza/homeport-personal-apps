import type { Linter } from 'eslint'

export const common: Linter.RulesRecord = {
  'react/function-component-definition': [
    // Prefer arrow functions for React components and avoid unnamed components with function expressions
    'error',
    {
      namedComponents: ['arrow-function'],
      unnamedComponents: 'function-expression',
    },
  ],
  'react/prop-types': 'off', // Prefer TypeScript prop types
  'react/react-in-jsx-scope': 'off', // Don't require React import in JSX files
  'react/require-default-props': 'off', // Prefer TypeScript prop types
}
