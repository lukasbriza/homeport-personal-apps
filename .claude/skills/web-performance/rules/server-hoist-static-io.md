---
title: Hoist static I/O to module level
impact: HIGH
tags: [server, io, route-handlers, og-image]
---

## Load request-invariant assets once, not per request

Fonts, logos, config, templates — anything the same across requests — should be read at module
level. Module code runs once on import; a read inside the handler runs on every request.

**Incorrect — reads the font on every request:**

```tsx
import { ImageResponse } from 'next/og'

export const GET = async (request: Request) => {
  const font = await fetch(new URL('./fonts/Inter.ttf', import.meta.url)).then((r) => r.arrayBuffer())
  return new ImageResponse(<div style={{ fontFamily: 'Inter' }}>Hello</div>, {
    fonts: [{ name: 'Inter', data: font }],
  })
}
```

**Correct — start the read once at module load, await in the handler:**

```tsx
import { ImageResponse } from 'next/og'

const fontPromise = fetch(new URL('./fonts/Inter.ttf', import.meta.url)).then((r) => r.arrayBuffer())

export const GET = async (request: Request) => {
  const font = await fontPromise // already loaded after the first request
  return new ImageResponse(<div style={{ fontFamily: 'Inter' }}>Hello</div>, {
    fonts: [{ name: 'Inter', data: font }],
  })
}
```

Synchronous `readFileSync` at module top is fine too (blocks only during init). **Don't** hoist
per-user/per-request data, files that change at runtime, huge files, or secrets that shouldn't
linger in memory.
