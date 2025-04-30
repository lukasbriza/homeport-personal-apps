import type { Linter } from 'eslint'

import { overrides } from './overrides'
import { rules } from './rules'

export const config = {
  env: { browser: false },
  rules,
  overrides,
} satisfies Linter.Config
