import next from '@next/eslint-plugin-next'
import tseslint from 'typescript-eslint'

import { reactConfig } from './react.mjs'

export const nextjsConfig = tseslint.config(
  ...reactConfig,
  {
    plugins: { '@next/next': next },
    rules: {
      ...next.configs.recommended.rules,
      ...next.configs['core-web-vitals'].rules,
    },
  },
  {
    files: ['**/app/**/*.{ts,tsx}', '**/pages/**/*.{ts,tsx}'],
    rules: {
      'react/function-component-definition': [
        'error',
        { namedComponents: ['arrow-function', 'function-declaration'], unnamedComponents: 'function-expression' },
      ],
    },
  },
  { files: ['**/app/**/layout.tsx', '**/layouts/**/*.tsx'], rules: { '@next/next/no-head-element': 'off' } },
  { files: ['**/next-env.d.ts'], rules: { 'unicorn/prevent-abbreviations': 'off' } },
)

export default nextjsConfig
