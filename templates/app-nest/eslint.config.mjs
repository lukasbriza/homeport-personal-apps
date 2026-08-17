import nestjs from '@lukasbriza/eslint-config/nestjs'

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    ignores: [
      'prisma/**',
      '**/*.generated.*',
      'src/modules/prisma/generated/**',
      'schema.graphql',
      'migrations/**',
      'database/**',
    ],
  },
  ...nestjs,
  { files: ['**/*.{ts,tsx,cts,mts}'], languageOptions: { parserOptions: { tsconfigRootDir: import.meta.dirname } } },
  {
    rules: {
      'lines-between-class-members': ['error', { enforce: [{ blankLine: 'always', prev: 'method', next: 'method' }] }],
    },
  },
]
