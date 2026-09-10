---
title: Don't send duplicate-derived data across the RSC boundary
impact: LOW
tags: [server, rsc, serialization, props]
---

## Pass raw data once; derive in the client

RSC→client serialization dedupes by **reference**, not value. Passing both the original and a
derived copy (`.toSorted()`, `.filter()`, `.map()`, `[...arr]`, `{...obj}`) sends the data twice —
those ops create a new reference. Derive in the client instead.

**Incorrect — sends the array twice:**

```tsx
<ClientList usernames={usernames} usernamesOrdered={usernames.toSorted()} />
```

**Correct — send once, sort on the client:**

```tsx
<ClientList usernames={usernames} />
```

```tsx
'use client'
const sorted = useMemo(() => [...usernames].sort(), [usernames])
```

Impact scales with data: `string[]`/`number[]` duplicate fully (higher cost); `object[]` only
duplicates the array shell (nested objects still dedupe by reference). **Exception:** pass derived
data when the transform is expensive or the client never needs the original.
