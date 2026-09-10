import type { ErrorBoundaryProps } from 'expo-router'

import { Message, Retry, RetryLabel, Screen, Title } from './error-boundary.styles'

// App-wide fallback UI. Expo Router passes the caught `error` and a `retry` that
// re-renders the failed route subtree.
export const ErrorBoundary = ({ error, retry }: ErrorBoundaryProps) => (
  <Screen>
    <Title>Something went wrong</Title>
    <Message>{error.message}</Message>
    <Retry
      onPress={() => {
        void retry()
      }}
    >
      <RetryLabel>Try again</RetryLabel>
    </Retry>
  </Screen>
)
