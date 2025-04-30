module.exports = {
  extends: ['@lukasbriza/eslint-config/cjs'],
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
}
