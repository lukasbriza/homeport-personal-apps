import nextjs from '@lukasbriza/eslint-config/nextjs'

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    ignores: ['**/*.generated.*', '.next/**', 'public/**', 'next.config.mjs', 'next-env.d.ts'],
  },
  ...nextjs,
  { files: ['**/*.{ts,tsx,cts,mts}'], languageOptions: { parserOptions: { tsconfigRootDir: import.meta.dirname } } },
]
