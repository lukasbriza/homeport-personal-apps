import type { Linter } from 'eslint'

import { typescript as base } from '../../base/overrides/typescript'

const [ts, dts] = base

export const typescript = [
  {
    ...ts,
    files: [ts.files, '*.tsx'],
  },
  dts,
] satisfies Linter.ConfigOverride[]
