import { dehydrate, HydrationBoundary } from '@tanstack/react-query'

import { Breeds } from '@/components/breeds'
import { $api } from '@/lib/api'
import { getQueryClient } from '@/lib/query/query-client'

import type { Route } from './+types/home'

export const meta = () => [{ title: 'React Router + TanStack Query' }]

// Loaders run on the server per request — prefetch, then ship the dehydrated cache.
export const loader = async () => {
  const queryClient = getQueryClient()
  await queryClient.prefetchQuery($api.queryOptions('get', '/breeds', { params: { query: { limit: 5 } } }))
  return { dehydratedState: dehydrate(queryClient) }
}

const Home = ({ loaderData }: Route.ComponentProps) => (
  <main>
    <h1>React Router + TanStack Query</h1>
    <HydrationBoundary state={loaderData.dehydratedState}>
      <Breeds />
    </HydrationBoundary>
  </main>
)

export default Home
