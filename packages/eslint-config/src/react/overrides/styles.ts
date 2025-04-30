import type { Linter } from 'eslint'

export const styles = {
  files: ['styles.ts', 'styles.tsx', '*.styles.ts', '*.styles.tsx', '**/styles/*.ts', '**/styles/*.tsx'],
  rules: {
    'no-magic-numbers': 'off', // Allow magic numbers in styles (e.g. z-index, spacing, etc.)
  },
} satisfies Linter.ConfigOverride
