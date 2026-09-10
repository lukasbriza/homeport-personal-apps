import base from '@lukasbriza/eslint-config'

/** @type {import('eslint').Linter.Config[]} */
export default [
  ...base,
  { files: ['**/*.{ts,tsx,cts,mts}'], languageOptions: { parserOptions: { tsconfigRootDir: import.meta.dirname } } },
]
