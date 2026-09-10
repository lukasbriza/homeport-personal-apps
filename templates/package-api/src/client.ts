import createFetchClient from 'openapi-fetch'
import createQueryClient from 'openapi-react-query'

import type { paths } from './schema'

// Generic engine: build a typed { fetchClient, $api } for ANY OpenAPI schema + baseUrl.
// This is what makes the package multi-schema. Each API pairs one schema with one
// named factory; baseUrl is always a per-app argument (env stays in the app).
//
// Add a second API:
//   1. drop its spec at `src/schema.billing.json`
//   2. `pnpm api-schema:generate` (add a line for it — see package.json)
//   3. below:
//        import type { paths as billingPaths } from './schema.billing'
//        export const createBillingApi = (baseUrl: string) => createApiClient<billingPaths>(baseUrl)
//   4. re-export its `paths` from index.ts under a namespaced alias
export const createApiClient = <Paths extends object>(baseUrl: string) => {
  const fetchClient = createFetchClient<Paths>({ baseUrl })
  const $api = createQueryClient(fetchClient)

  return { fetchClient, $api }
}

// The project's primary API (schema: ./schema.ts). Each app binds it to its own
// baseUrl in a small `lib/api.ts`.
export const createApi = (baseUrl: string) => createApiClient<paths>(baseUrl)

export type Api = ReturnType<typeof createApi>
