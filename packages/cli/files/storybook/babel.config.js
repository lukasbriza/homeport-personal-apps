export default {
  presets: [['@babel/preset-env', { targets: { chrome: 100 } }], '@babel/preset-typescript', '@babel/preset-react'],
  plugins: ['react-docgen'],
  sourceType: 'unambiguous',
}
