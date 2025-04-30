import type { Linter } from 'eslint'

export const overrides = [
  {
    files: 'src/*/models/*.ts',
    rules: {
      'import/no-cycle': 'off', // Allow circular dependencies in models as they might reference each other
    },
  },
] satisfies Linter.ConfigOverride[]
