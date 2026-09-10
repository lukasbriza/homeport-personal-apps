'use client'

import { $api } from '@/lib/api'

// Typed query hook. The data is prefetched on the server (see the home page's
// HydrationBoundary), so this renders with data already in cache — no loading flash.
export const Breeds = () => {
  const { data, isPending, error } = $api.useQuery('get', '/breeds', { params: { query: { limit: 5 } } })

  if (isPending) {
    return <p>Loading breeds…</p>
  }

  if (error) {
    return <p>Failed to load breeds.</p>
  }

  return (
    <ul>
      {data.map((breed, index) => (
        <li key={breed.breed ?? index}>{breed.breed}</li>
      ))}
    </ul>
  )
}
