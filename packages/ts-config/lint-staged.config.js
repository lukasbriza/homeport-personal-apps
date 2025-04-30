export default {
  './**/.{cjs,js}': 'eslint --cache --fix',
  './**/*.{json,md}': 'prettier --write',
}
