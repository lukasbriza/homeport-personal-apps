import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import globals from 'globals'
import tseslint from 'typescript-eslint'

import { base } from './base.mjs'

// Mirrors the `react` preset but for React Native: no jsx-a11y (there are no DOM
// roles/attributes to lint), and RN runtime globals instead of the browser.
const reactNativeRules = {
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

export const reactNativeConfig = tseslint.config(
  ...base,
  { settings: { react: { version: 'detect' } } },
  react.configs.flat.recommended,
  react.configs.flat['jsx-runtime'],
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    plugins: { 'react-hooks': reactHooks },
    languageOptions: {
      // RN's runtime is neither pure node nor browser; it exposes fetch/console/
      // timers plus the `__DEV__` flag.
      globals: { ...globals['shared-node-browser'], __DEV__: 'readonly' },
    },
    rules: {
      ...reactHooks.configs['recommended-latest'].rules,
      ...reactNativeRules,
    },
  },
  {
    files: ['**/*.styles.{ts,tsx}', '**/styles/*.{ts,tsx}'],
    rules: { 'no-magic-numbers': 'off' },
  },
)

export default reactNativeConfig
