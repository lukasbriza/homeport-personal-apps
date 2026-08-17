import { createApi } from '@lukasbriza/api'

// One client for the app. Set the real baseUrl here (placeholder today); wire it to
// `import.meta.env.VITE_*` when you have real environments. Components import `$api`
// from here — never from `@lukasbriza/api` directly.
export const { $api, fetchClient } = createApi('https://my-api.cz/')
