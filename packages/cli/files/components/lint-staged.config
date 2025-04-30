export default {
  './**/*.{cjs,js}': 'eslint --cache --fix',
  './**/*.{json,md,mdx}': 'prettier --write',
  './**/*.{ts,tsx}': [() => 'tsc --build tsconfig.json', 'eslint --cache --fix'],
}
