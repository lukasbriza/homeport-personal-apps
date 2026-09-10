import { ThemeProvider } from '@emotion/react'
import { Stack } from 'expo-router'
import { useColorScheme } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'

import { QueryProvider } from '@/lib/query/providers'
import { UiStoreProvider } from '@/stores/ui-store-provider'
import { darkTheme, lightTheme } from '@/theme'

import { Root } from './_layout.styles'

// Root layout — wraps every route once. Provider order (outer → inner):
// gesture root → safe-area → theme → data/query → store → navigator.
const RootLayout = () => {
  const scheme = useColorScheme()
  const theme = scheme === 'dark' ? darkTheme : lightTheme

  return (
    <Root>
      <SafeAreaProvider>
        <ThemeProvider theme={theme}>
          <QueryProvider>
            <UiStoreProvider>
              <Stack />
            </UiStoreProvider>
          </QueryProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </Root>
  )
}

export default RootLayout

// Expo Router renders this instead of a crashing route subtree. Exporting it from
// the root layout makes it the app-wide fallback.
export { ErrorBoundary } from '@/components/error-boundary'
