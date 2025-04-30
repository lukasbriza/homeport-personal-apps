import type { Linter } from 'eslint'

import { overrides } from './overrides'

export const config = {
  extends: ['plugin:@next/next/recommended'],
  plugins: ['@next/next'],
  overrides,
} satisfies Linter.Config
