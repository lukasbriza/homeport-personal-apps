import { $api } from '@/lib/api'

import { BreedItem, BreedList } from './breeds.styles'

// Typed query hook — reads from the cache hydrated by the route loader.
export const Breeds = () => {
  const { data, isPending, error } = $api.useQuery('get', '/breeds', { params: { query: { limit: 5 } } })

  if (isPending) {
    return <p>Loading breeds…</p>
  }

  if (error) {
    return <p>Failed to load breeds.</p>
  }

  return (
    <BreedList>
      {data.map((breed, index) => (
        <BreedItem key={breed.breed ?? index}>{breed.breed}</BreedItem>
      ))}
    </BreedList>
  )
}
