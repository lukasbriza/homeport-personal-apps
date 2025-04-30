module.exports = {
  extends: './cjs',
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
  rules: {
    'no-magic-numbers': 'off',
  },
}
