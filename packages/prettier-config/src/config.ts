import type { Config } from 'prettier'

export const config = {
  arrowParens: 'always',
  bracketSpacing: true,
  plugins: ['prettier-plugin-packagejson'],
  printWidth: 120,
  semi: false,
  singleQuote: true,
  tabWidth: 2,
  trailingComma: 'all',
  useTabs: false,
  overrides: [
    {
      // https://github.com/prettier/prettier/issues/15956
      files: '*.json',
      options: { trailingComma: 'none' },
    },
  ],
} satisfies Config
