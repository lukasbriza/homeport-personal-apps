import js from '@eslint/js'
import turboConfig from 'eslint-config-turbo/flat'
import importPlugin from 'eslint-plugin-import'
import prettierRecommended from 'eslint-plugin-prettier/recommended'
import unicorn from 'eslint-plugin-unicorn'
import unusedImports from 'eslint-plugin-unused-imports'
import globals from 'globals'
import tseslint from 'typescript-eslint'

// Production code must not import devDependencies; config, scripts, tests and type
// declarations may.
export const extraneousDependenciesPatterns = [
  '**/*.config.{cjs,js,mjs,ts}',
  '**/*.stories.{ts,tsx}',
  '**/codegen.ts',
  '**/scripts/**/*',
  '**/stories/**/*',
  '**/tests/**/*',
  '**/*.test.{ts,tsx}',
  '**/*.spec.{ts,tsx}',
  '**/types/*.d.ts',
  '**/vite.config.ts',
  '**/vitest.config.{ts,mts,mjs}',
]

// Formatting is owned by Prettier; only semantic rules here.
const commonRules = {
  'array-callback-return': ['error', { allowImplicit: true }],
  'arrow-body-style': ['error', 'as-needed'],
  curly: ['error', 'all'],
  'max-classes-per-file': ['error', { ignoreExpressions: true, max: 3 }],
  'no-console': 'warn',
  'no-debugger': 'warn',
  'no-nested-ternary': 'error',
  'no-param-reassign': 'off',
  'no-restricted-exports': ['error', { restrictDefaultExports: { named: true, namespaceFrom: true } }],
  'no-shadow': 'off',
  'no-use-before-define': 'off',
  'no-warning-comments': ['warn', { terms: ['fixme', 'todo'] }],
}

const importRules = {
  'import/order': [
    'error',
    {
      alphabetize: { caseInsensitive: true, order: 'asc' },
      groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
      'newlines-between': 'always',
    },
  ],
  'import/no-extraneous-dependencies': ['error', { devDependencies: extraneousDependenciesPatterns }],
  'import/prefer-default-export': 'off',
  'import/namespace': 'off',
  'import/default': 'off',
  'import/no-named-as-default': 'off',
  'import/no-named-as-default-member': 'off',
  'unused-imports/no-unused-imports': 'error',
  'unused-imports/no-unused-vars': ['error', { ignoreRestSiblings: true }],
}

const unicornRules = {
  'unicorn/no-array-callback-reference': 'off',
  'unicorn/no-nested-ternary': 'off',
  'unicorn/no-null': 'off',
  'unicorn/prevent-abbreviations': 'off',
}

const typescriptRules = {
  '@typescript-eslint/no-unused-vars': 'off',
  '@typescript-eslint/no-use-before-define': 'error',
  '@typescript-eslint/consistent-type-assertions': 'error',
  '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
  '@typescript-eslint/consistent-type-exports': 'error',
  '@typescript-eslint/consistent-type-imports': 'error',
  '@typescript-eslint/no-unsafe-declaration-merging': 'error',
  '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
  '@typescript-eslint/no-empty-object-type': ['error', { allowInterfaces: 'with-single-extends' }],
}

export const base = tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/build/**',
      '**/.next/**',
      '**/.turbo/**',
      '**/coverage/**',
      '**/node_modules/**',
      '**/*.generated.*',
      '**/graphify-out/**',
      '**/storybook-static/**',
    ],
  },
  js.configs.recommended,
  importPlugin.flatConfigs.recommended,
  importPlugin.flatConfigs.typescript,
  unicorn.configs.recommended,
  ...turboConfig,
  {
    // Override the low ecmaVersion set by eslint-plugin-import's flat recommended config.
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.node, ...globals.es2021 },
    },
    plugins: { 'unused-imports': unusedImports },
    settings: { 'import/resolver': { typescript: true, node: true } },
    rules: { ...commonRules, ...importRules, ...unicornRules },
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.cts', '**/*.mts'],
    extends: [tseslint.configs.strictTypeChecked, tseslint.configs.stylisticTypeChecked],
    languageOptions: { parserOptions: { projectService: true } },
    rules: typescriptRules,
  },
  { files: ['**/*.d.ts'], rules: { '@typescript-eslint/consistent-type-imports': 'off' } },
  {
    files: ['**/*.cjs'],
    languageOptions: { sourceType: 'commonjs' },
    rules: { '@typescript-eslint/no-require-imports': 'off', 'unicorn/prefer-module': 'off' },
  },
  {
    files: ['**/*.config.{js,mjs,cjs}', '**/lint-staged.config.{js,mjs,cjs}', '**/babel.config.{js,cjs}'],
    rules: { 'unicorn/prefer-module': 'off', 'import/no-extraneous-dependencies': 'off' },
  },
  prettierRecommended,
)

export default base
