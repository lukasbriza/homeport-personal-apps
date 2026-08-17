import type { PropsWithChildren } from 'react'
import { Links, Meta, Outlet, Scripts, ScrollRestoration } from 'react-router'

import { QueryProvider } from '@/lib/query/providers'
import { UiStoreProvider } from '@/stores/ui-store-provider'
import { GlobalStyles } from '@/styles/global'

// import { ThemeProvider } from '@lukasbriza/theme' // uncomment when consuming the monorepo theme

// The Emotion CacheProvider lives in entry.{server,client}.tsx (it must wrap the app
// before hydration); theme, query and store context providers live here.

// Wraps every route — the document shell.
export const Layout = ({ children }: PropsWithChildren) => (
  <html lang="en">
    <head>
      <meta charSet="utf-8" />
      <meta content="width=device-width, initial-scale=1" name="viewport" />
      <Meta />
      <Links />
    </head>
    <body>
      <GlobalStyles />
      {children}
      <ScrollRestoration />
      <Scripts />
    </body>
  </html>
)

// App-wide providers live here, once.
const App = () => (
  // <ThemeProvider>
  <QueryProvider>
    <UiStoreProvider>
      <Outlet />
    </UiStoreProvider>
  </QueryProvider>
  // </ThemeProvider>
)

export default App
