'use client'

import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import type { PropsWithChildren } from 'react'

import { getQueryClient } from './query-client'

export const QueryProvider = ({ children }: PropsWithChildren) => {
  // getQueryClient() handles the server-per-request / browser-singleton split,
  // so we intentionally don't wrap it in useState here.
  const queryClient = getQueryClient()

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
