import { createApi } from '@lukasbriza/api'

// One client for the app. Set the real baseUrl here (placeholder today); wire it via
// `next-runtime-env` (`env('NEXT_PUBLIC_API_BASE_URL')`) when you have real environments.
// Components/pages import `$api` from here — never from `@lukasbriza/api` directly.
export const { $api, fetchClient } = createApi('https://my-api.cz/')
