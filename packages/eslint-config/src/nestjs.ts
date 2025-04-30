import type { Linter } from 'eslint'

import { config } from './nestjs/config'

export = {
  ...config,
  extends: [require.resolve('./base')],
} satisfies Linter.Config
