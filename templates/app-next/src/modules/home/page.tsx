import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import type { Metadata } from 'next'

import { getScopedI18n } from '@/i18n/server'
import { $api } from '@/lib/api'
import { getQueryClient } from '@/lib/query/query-client'
import type { WebPage } from '@/shared/types'

import { Breeds } from './components/breeds'
import { Greeting } from './components/greeting'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getScopedI18n('home')

  return {
    title: t('title'),
    description: t('description'),
  }
}

export const HomePage: WebPage = async () => {
  const t = await getScopedI18n('home')

  // Prefetch on the server; <Breeds /> reads the same query from the hydrated cache.
  const queryClient = getQueryClient()
  await queryClient.prefetchQuery($api.queryOptions('get', '/breeds', { params: { query: { limit: 5 } } }))

  return (
    <main>
      <Greeting description={t('description')} title={t('title')} />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <Breeds />
      </HydrationBoundary>
    </main>
  )
}
