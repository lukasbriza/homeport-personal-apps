export default {
  './**/*.{js,mjs}': 'eslint --cache --fix',
  './**/*.{graphql,json,md}': 'prettier --write',
  './**/*.ts': [() => 'tsc --build tsconfig.json', 'eslint --cache --fix'],
}
