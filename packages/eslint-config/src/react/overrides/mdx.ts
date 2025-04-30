import type { Linter } from 'eslint'

export const mdx: Linter.ConfigOverride = {
  files: '*.mdx',
  extends: ['plugin:mdx/recommended'],
  rules: {
    'react/jsx-filename-extension': 'off', // Allow .mdx files to contain JSX
    'react/jsx-sort-props': 'off', // Props sorting with MDX parser does not work as expected (props are sorted but values are not)
    'react/self-closing-comp': 'off', // MDX parser wrongly converts some non-void elements to self-closing and removes their children
  },
}
