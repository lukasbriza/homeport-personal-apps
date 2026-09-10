// Babel config for Expo (CommonJS — see metro.config.js note). `babel-preset-expo`
// includes the Expo Router plugin AND (SDK 56) the Reanimated worklets plugin, so no
// extra plugin entry is needed. If Reanimated animations don't run, add
// 'react-native-worklets/plugin' as the LAST entry in `plugins`.
module.exports = (api) => {
  api.cache(true)

  return {
    presets: ['babel-preset-expo'],
  }
}
