import type { Linter } from 'eslint'

import { config } from './storybook/config'

export = {
  ...config,
  extends: [require.resolve('./react')],
} satisfies Linter.Config
