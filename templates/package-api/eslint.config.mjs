import base from '@lukasbriza/eslint-config'

/** @type {import('eslint').Linter.Config[]} */
export default [
  ...base,
  { files: ['**/*.{ts,cts,mts}'], languageOptions: { parserOptions: { tsconfigRootDir: import.meta.dirname } } },
  // Generated OpenAPI schemas (schema.ts, schema.<name>.ts) are not hand-written.
  { ignores: ['src/schema*.ts'] },
]
