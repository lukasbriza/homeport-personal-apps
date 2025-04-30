import type { Linter } from 'eslint'

export const overrides = [
  {
    files: 'next-env.d.ts',
    rules: {
      'unicorn/prevent-abbreviations': 'off', // next-env.d.ts is a Next.js convention
    },
  },
  {
    files: ['src/app/**/*.ts', 'src/app/**/*.tsx', 'src/pages/**/*.ts', 'src/pages/**/*.tsx'],
    rules: {
      'react/function-component-definition': [
        // Allow components as function declarations in Next.js App and Page components for shorthand default exports
        'error',
        {
          namedComponents: ['arrow-function', 'function-declaration'],
          unnamedComponents: 'function-expression',
        },
      ],
    },
  },
  {
    files: ['src/app/**/layout.tsx', 'src/**/layouts/**/*.tsx'],
    rules: {
      '@next/next/no-head-element': 'off', // Allow <head/> element in Next.js App layouts
    },
  },
  {
    files: ['src/**/layouts/**/*.tsx', 'src/pages/_app.tsx', 'src/pages/_document.tsx'],
    rules: {
      'react/jsx-props-no-spreading': 'off', // Allow spreading props in Next.js App layouts, _app.tsx and _document.tsx
    },
  },
] satisfies Linter.ConfigOverride[]
