import createCache from '@emotion/cache'

// One cache per request on the server, one for the app lifetime on the client.
// `key: 'css'` matches the `data-emotion` attribute the server injects, so the
// client adopts the SSR styles instead of re-inserting them (no flash).
export const createEmotionCache = () => createCache({ key: 'css' })
