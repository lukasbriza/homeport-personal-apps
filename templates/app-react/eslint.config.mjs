import react from '@lukasbriza/eslint-config/react'

/** @type {import('eslint').Linter.Config[]} */
export default [
  { ignores: ['build/**', '.react-router/**'] },
  ...react,
  { files: ['**/*.{ts,tsx,cts,mts}'], languageOptions: { parserOptions: { tsconfigRootDir: import.meta.dirname } } },
  // RR's route manifest legitimately imports the dev-time route helpers (@react-router/dev).
  { files: ['app/routes.ts'], rules: { 'import/no-extraneous-dependencies': ['error', { devDependencies: true }] } },
]
