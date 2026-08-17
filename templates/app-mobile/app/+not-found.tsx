import { Link, Stack } from 'expo-router'

import { HomeLink, Message, Screen } from './+not-found.styles'

// Expo Router renders this for any unmatched route (`app/+not-found.tsx`).
const NotFound = () => (
  <Screen>
    <Stack.Screen options={{ title: 'Oops!' }} />
    <Message>This screen doesn&apos;t exist.</Message>
    <Link href="/">
      <HomeLink>Go home</HomeLink>
    </Link>
  </Screen>
)

export default NotFound
