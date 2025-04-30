import type { Linter } from 'eslint'

import { importExtensions } from '../constants'

import { overrides } from './overrides'
import { rules } from './rules'

export const config = {
  env: { es2024: true, node: true },
  extends: [
    'plugin:@typescript-eslint/recommended',
    'plugin:import/typescript',
    'plugin:prettier/recommended',
    'plugin:unicorn/recommended',
    'prettier',
    'turbo',
  ],
  ignorePatterns: ['.idea', '.vscode', 'build', 'coverage', 'dist', 'node_modules'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaFeatures: { modules: true },
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint', 'import', 'prettier', 'unicorn', 'unused-imports', 'prettier', 'turbo'],
  rules,
  overrides,
  settings: {
    'import/extensions': importExtensions,
    'import/resolver': { typescript: {} },
  },
} satisfies Linter.Config
