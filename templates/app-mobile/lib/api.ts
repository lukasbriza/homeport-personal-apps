import { createApi } from '@lukasbriza/api'

import { env } from './env'

// One client instance for the app, bound to the env-derived baseUrl. Components
// import `$api` from here — never from `@lukasbriza/api` directly.
export const { $api, fetchClient } = createApi(env.apiBaseUrl)
