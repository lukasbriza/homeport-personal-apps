---
title: Defer non-critical third-party libraries
impact: MEDIUM
tags: [bundle, third-party, analytics, defer]
---

## Load analytics/logging after hydration

Analytics, logging, and error-tracking don't block interaction — keep them out of the initial
bundle by loading them client-side with `next/dynamic` (`ssr: false`).

**Incorrect — ships in the initial bundle:**

```tsx
import { Analytics } from '@vercel/analytics/react'

const RootLayout = ({ children }: PropsWithChildren) => (
  <html>
    <body>
      {children}
      <Analytics />
    </body>
  </html>
)
```

**Correct — loads after hydration:**

```tsx
import dynamic from 'next/dynamic'

const Analytics = dynamic(() => import('@vercel/analytics/react').then((m) => m.Analytics), {
  ssr: false,
})

const RootLayout = ({ children }: PropsWithChildren) => (
  <html>
    <body>
      {children}
      <Analytics />
    </body>
  </html>
)
```

Applies to any non-critical client widget (analytics, chat, flag clients). For `<script>`-based
third parties, prefer `next/script` with `strategy="afterInteractive"` / `"lazyOnload"`.
