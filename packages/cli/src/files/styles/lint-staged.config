export default {
  './**/*.{cjs,js}': 'eslint --cache --fix',
  './**/*.{json,md}': 'prettier --write',
  './**/*.ts': [() => 'tsc --build tsconfig.json', 'eslint --cache --fix'],
};
