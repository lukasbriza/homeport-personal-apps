import { QueryClient, defaultShouldDehydrateQuery } from '@tanstack/react-query'

const makeQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { staleTime: 60 * 1000 },
      dehydrate: {
        // Also dehydrate pending queries so streamed prefetches reach the client.
        shouldDehydrateQuery: (query) => defaultShouldDehydrateQuery(query) || query.state.status === 'pending',
      },
    },
  })

let browserQueryClient: QueryClient | undefined

/**
 * Server: a fresh client per request (never shared between users).
 * Browser: a singleton so Suspense/re-renders don't recreate the cache.
 */
export const getQueryClient = () => {
  // The server has no `window`; DOM lib types don't model that, so read it as optional.
  const isServer = (globalThis as { window?: Window }).window === undefined

  if (isServer) {
    return makeQueryClient()
  }
  browserQueryClient ??= makeQueryClient()
  return browserQueryClient
}
