import type { Linter } from 'eslint'

export const jsx: Linter.RulesRecord = {
  'react/jsx-filename-extension': [
    // Allow JSX only in .tsx files
    'error',
    { allow: 'as-needed', extensions: ['.tsx'] },
  ],
  'react/jsx-key': 'error', // Require keys in iterators and map calls
  'react/jsx-sort-props': [
    // Sort props alphabetically
    'error',
    {
      reservedFirst: true, // Put React reserved props first (e.g. key, ref)
      callbacksLast: true, // Put callback props last
    },
  ],
  'react/jsx-uses-react': 'off', // Avoid unnecessary React runtime import
  'react/no-unstable-nested-components': ['error', { allowAsProps: true }], // Avoid nested components that are unstable, however, allow them as props (preferably memoized)
}
