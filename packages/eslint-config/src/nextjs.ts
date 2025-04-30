import type { Linter } from 'eslint'

import { config } from './nextjs/config'

export = {
  ...config,
  extends: [require.resolve('./react'), ...config.extends],
} satisfies Linter.Config
