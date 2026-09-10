import { Stack } from 'expo-router'
import Animated, { FadeIn } from 'react-native-reanimated'

import { Breeds } from '@/components/breeds'

import { Screen, Title } from './index.styles'

// The `/` route. The FadeIn on the title is a Reanimated smoke test — if it
// animates on launch, the worklets/Reanimated Babel plugin is wired correctly.
const Home = () => (
  <Screen edges={['top']}>
    <Stack.Screen options={{ title: 'Breeds' }} />
    <Animated.View entering={FadeIn.duration(400)}>
      <Title>Cat breeds</Title>
    </Animated.View>
    <Breeds />
  </Screen>
)

export default Home
