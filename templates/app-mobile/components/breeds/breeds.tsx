import { ActivityIndicator, Text } from 'react-native'

import { $api } from '@/lib/api'

import { BreedItem, BreedList } from './breeds.styles'

// Typed query hook — same $api as the web templates. On RN there is no server
// prefetch/hydration, so the component just fetches on mount via TanStack Query.
export const Breeds = () => {
  const { data, isPending, error } = $api.useQuery('get', '/breeds', { params: { query: { limit: 5 } } })

  if (isPending) {
    return <ActivityIndicator />
  }

  if (error) {
    return <Text>Failed to load breeds.</Text>
  }

  return (
    <BreedList>
      {data.map((breed, index) => (
        <BreedItem key={breed.breed ?? index}>{breed.breed}</BreedItem>
      ))}
    </BreedList>
  )
}
