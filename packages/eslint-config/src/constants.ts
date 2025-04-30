export const extraneousDependenciesPatterns = [
  '**/*.config.cjs',
  '**/*.config.js',
  '**/*.config.mjs',
  '**/*.config.ts',
  '**/codegen.ts',
  '**/scripts/**/*',
  '**/tests/**/*',
  '**/types/*.d.ts',
  '**/vite.config.ts',
] as const

export const importExtensions = ['.cjs', '.js', '.ts'] as const
