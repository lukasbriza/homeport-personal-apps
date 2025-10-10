module.exports = {
  extends: ['@lukasbriza/eslint-config/nestjs'],
  parserOptions: {
    project: 'tsconfig.json',
    tsconfigRootDir: __dirname,
  },
  rules: {
    'no-magic-numbers': 'off',
    'lines-between-class-members': [
      'error',
      {
        enforce: [{ blankLine: 'always', prev: 'method', next: 'method' }],
      },
    ],
  },
  overrides: [
    {
      files: ['**/*.spec.ts', '**/*.test.ts'],
      rules: {
        'import/no-extraneous-dependencies': 'off',
      },
    },
  ],
}
