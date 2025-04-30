export default {
  './*.{cjs,js}': 'eslint --cache --fix',
  './*.{json,md,yml,yaml}': 'prettier --write',
  './github/**/*.{yml,yaml}': 'prettier --write',
}
