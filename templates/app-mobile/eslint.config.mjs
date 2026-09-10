import reactNative from '@lukasbriza/eslint-config/react-native'

/** @type {import('eslint').Linter.Config[]} */
export default [
  { ignores: ['.expo/**', 'dist/**', 'expo-env.d.ts', 'metro.config.js', 'babel.config.js'] },
  ...reactNative,
  { files: ['**/*.{ts,tsx}'], languageOptions: { parserOptions: { tsconfigRootDir: import.meta.dirname } } },
]
