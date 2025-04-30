import type { Linter } from 'eslint'

import { rules } from './rules'

export const config = {
  rules,
} satisfies Linter.Config
