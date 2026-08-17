import { QueryClient, defaultShouldDehydrateQuery } from '@tanstack/react-query'

const makeQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { staleTime: 60 * 1000 },
      dehydrate: {
        shouldDehydrateQuery: (query) => defaultShouldDehydrateQuery(query) || query.state.status === 'pending',
      },
    },
  })

let browserQueryClient: QueryClient | undefined

/**
 * Server: a fresh client per request (never shared between users).
 * Browser: a singleton so re-renders don't recreate the cache.
 */
export const getQueryClient = () => {
  const isServer = (globalThis as { window?: Window }).window === undefined

  if (isServer) {
    return makeQueryClient()
  }
  browserQueryClient ??= makeQueryClient()
  return browserQueryClient
}
