---
title: Run side effects after the response with after()
impact: MEDIUM
tags: [server, side-effects, logging, analytics]
---

## Don't block the response on logging/analytics

Move non-critical side effects (logging, analytics, notifications, cache invalidation) into
Next's `after()` so the response is sent first and the work runs in the background.

**Incorrect — logging delays the response:**

```ts
export const POST = async (request: Request) => {
  await updateDatabase(request)
  await logUserAction({ userAgent: request.headers.get('user-agent') ?? 'unknown' })
  return Response.json({ status: 'success' })
}
```

**Correct — respond now, log after:**

```ts
import { after } from 'next/server'

export const POST = async (request: Request) => {
  await updateDatabase(request)

  after(async () => {
    await logUserAction({ userAgent: request.headers.get('user-agent') ?? 'unknown' })
  })

  return Response.json({ status: 'success' })
}
```

`after()` runs even on error/redirect, and works in route handlers, server actions, and Server
Components. Use for audit logs, analytics, notifications, cache invalidation, cleanup.
