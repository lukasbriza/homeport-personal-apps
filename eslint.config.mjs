import base from '@lukasbriza/eslint-config'

/** @type {import('eslint').Linter.Config[]} */
export default [
  ...base,
  { files: ['**/*.{ts,tsx,cts,mts}'], languageOptions: { parserOptions: { tsconfigRootDir: import.meta.dirname } } },
  {
    // MCP servers with their own code are standalone packages outside the pnpm/turbo
    // workspace (turbo's env-var cache rule does not apply) and log JSON lines to stdout.
    files: ['apps/mcp-servers/**/*.ts'],
    rules: {
      'turbo/no-undeclared-env-vars': 'off',
      'no-console': 'off',
      // @modelcontextprotocol/sdk maps subpath types to `*.js.d.ts`, which the import
      // resolver cannot find; tsc resolves these imports and fails the build if they break.
      'import/no-unresolved': ['error', { ignore: ['^@modelcontextprotocol/sdk/'] }],
    },
  },
]
