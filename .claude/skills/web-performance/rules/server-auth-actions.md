---
title: Authenticate server actions like public endpoints
impact: CRITICAL
tags: [server, server-actions, security, authorization]
---

## Auth + authz inside every server action

A `'use server'` action is a public endpoint — it can be invoked directly, so middleware/layout
guards don't protect it. Verify authentication **and** authorization inside each action, and
validate input first.

**Incorrect — anyone can call it:**

```ts
'use server'

export const deleteUser = async (userId: string) => {
  await db.user.delete({ where: { id: userId } })
  return { success: true }
}
```

**Correct — validate → authenticate → authorize → mutate:**

```ts
'use server'

import { object, string } from 'yup'

import { verifySession } from '@/lib/auth'

const schema = object({ userId: string().uuid().required() })

export const deleteUser = async (input: unknown) => {
  const { userId } = await schema.validate(input)

  const session = await verifySession()
  if (!session) throw new Error('Unauthorized')
  if (session.user.role !== 'admin' && session.user.id !== userId) {
    throw new Error('Forbidden')
  }

  await db.user.delete({ where: { id: userId } })
  return { success: true }
}
```

Order matters: validate untrusted input first, then auth, then authz, then the mutation. Same
discipline as a NestJS controller — never trust the caller.
