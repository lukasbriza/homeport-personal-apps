---
title: Deduplicate per-request work with React.cache()
impact: MEDIUM
tags: [server, cache, react-cache, deduplication]
---

## Wrap request-scoped queries in `cache()`

`cache()` from React dedupes an async call within a single server request — multiple callers in
the tree run the query once. Best for auth and DB reads.

```ts
import { cache } from 'react'

export const getCurrentUser = cache(async () => {
  const session = await auth()
  if (!session?.user?.id) return null
  return db.user.findUnique({ where: { id: session.user.id } })
})
```

**Use primitive args** — `cache()` keys by `Object.is`, so a fresh inline object is always a miss:

```ts
const getUser = cache(async (uid: string) => db.user.findUnique({ where: { id: uid } }))

getUser('1') // runs
getUser('1') // cache hit
```

(If you must pass an object, pass the same reference.)

**Next note:** `fetch()` is already request-deduped by Next, so you don't need `cache()` for it —
use `cache()` for non-fetch work: Prisma/DB queries, auth checks, heavy computation, fs reads.
