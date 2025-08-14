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
}
