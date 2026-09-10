import { QueryClientProvider } from '@tanstack/react-query'
import type { PropsWithChildren } from 'react'

import { queryClient } from './query-client'

// No devtools here: @tanstack/react-query-devtools is web-only. Use Flipper or the
// React Native devtools plugin if you want a query inspector on device.
export const QueryProvider = ({ children }: PropsWithChildren) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
)
