import { QueryClient } from '@tanstack/react-query'

// React Native has no SSR, so a single app-lifetime client is all we need — no
// per-request/per-browser split like the web templates.
export const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 60 * 1000 } },
})
