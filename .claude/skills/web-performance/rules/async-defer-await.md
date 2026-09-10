---
title: Defer await until the branch that needs it
impact: HIGH
tags: [async, await, early-return]
---

## Defer await into the branch that uses it

Move `await` into the branch that actually needs the value, so paths that return early don't
block on it. Pairs with early returns.

**Incorrect — awaits before the early return:**

```ts
const updateResource = async (resourceId: string, userId: string) => {
  const permissions = await fetchPermissions(userId)
  const resource = await getResource(resourceId)
  if (!resource) return { error: 'Not found' }
  if (!permissions.canEdit) return { error: 'Forbidden' }
  return updateResourceData(resource, permissions)
}
```

**Correct — fetch each thing only once it's needed:**

```ts
const updateResource = async (resourceId: string, userId: string) => {
  const resource = await getResource(resourceId)
  if (!resource) return { error: 'Not found' }

  const permissions = await fetchPermissions(userId)
  if (!permissions.canEdit) return { error: 'Forbidden' }

  return updateResourceData(resource, permissions)
}
```

Most valuable when the early-return path is common or the deferred call is expensive. General
form of `async-cheap-condition-before-await`. Don't over-serialize: if two values are always
needed and independent, prefer `async-parallel`.
