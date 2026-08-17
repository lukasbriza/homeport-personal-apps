import react from '@lukasbriza/eslint-config/react'

/** @type {import('eslint').Linter.Config[]} */
export default [
  ...react,
  { files: ['**/*.{ts,tsx,cts,mts}'], languageOptions: { parserOptions: { tsconfigRootDir: import.meta.dirname } } },
  { rules: { 'react/jsx-props-no-spreading': 'off' } },
]
