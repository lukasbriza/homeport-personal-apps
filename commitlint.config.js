export default {
  extends: '@commitlint/config-conventional',
  './*.{cjs,js}': 'eslint --cache --fix',
  './*.{json,md,yml,yaml}': 'prettier --write',
  './github/**/*.{yml,yaml}': 'prettier --write',
}
