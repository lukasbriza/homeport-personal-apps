// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import react from '@lukasbriza/eslint-config/react'
import storybook from 'eslint-plugin-storybook'

/** @type {import('eslint').Linter.Config[]} */
export default [
  { ignores: ['storybook-static/**'] },
  ...react,
  { files: ['**/*.{ts,tsx,cts,mts}'], languageOptions: { parserOptions: { tsconfigRootDir: import.meta.dirname } } },
  // Storybook config legitimately uses require.resolve / __dirname.
  { files: ['config/**/*.{ts,tsx}'], rules: { 'unicorn/prefer-module': 'off' } },
  ...storybook.configs['flat/recommended'],
]
