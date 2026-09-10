import jsxA11y from 'eslint-plugin-jsx-a11y'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import globals from 'globals'
import tseslint from 'typescript-eslint'

import { base } from './base.mjs'

const reactRules = {
  'react/function-component-definition': [
    'error',
    { namedComponents: ['arrow-function'], unnamedComponents: 'function-expression' },
  ],
  'react/prop-types': 'off',
  'react/react-in-jsx-scope': 'off',
  'react/require-default-props': 'off',
  'react/jsx-uses-react': 'off',
  'react/jsx-key': 'error',
  'react/jsx-sort-props': ['error', { reservedFirst: true, callbacksLast: true }],
  'react/no-unstable-nested-components': ['error', { allowAsProps: true }],
  'react/jsx-filename-extension': ['error', { allow: 'as-needed', extensions: ['.tsx'] }],
  'react-hooks/exhaustive-deps': 'error',
}

export const reactConfig = tseslint.config(
  ...base,
  { settings: { react: { version: 'detect' } } },
  react.configs.flat.recommended,
  react.configs.flat['jsx-runtime'],
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    plugins: { 'react-hooks': reactHooks, 'jsx-a11y': jsxA11y },
    languageOptions: { globals: { ...globals.browser } },
    rules: {
      ...jsxA11y.flatConfigs.recommended.rules,
      ...reactHooks.configs['recommended-latest'].rules,
      ...reactRules,
    },
  },
  {
    files: ['**/styles.{ts,tsx}', '**/*.styles.{ts,tsx}', '**/styles/*.{ts,tsx}'],
    rules: { 'no-magic-numbers': 'off' },
  },
)

export default reactConfig
