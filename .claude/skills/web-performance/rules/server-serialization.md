---
title: Pass only the fields the client uses across the RSC boundary
impact: HIGH
tags: [server, rsc, serialization, props]
---

## Serialize the minimum at the server/client boundary

Every prop crossing into a client component is serialized into the HTML and RSC payload — page
weight scales with it. Pass the specific fields the client needs, not whole objects.

**Incorrect — serializes all 50 fields:**

```tsx
const Page = async () => {
  const user = await fetchUser() // 50 fields
  return <Profile user={user} />
}
```

```tsx
'use client'
const Profile = ({ user }: { user: User }) => <div>{user.name}</div> // uses 1
```

**Correct — serialize one field:**

```tsx
const Page = async () => {
  const user = await fetchUser()
  return <Profile name={user.name} />
}
```

```tsx
'use client'
const Profile = ({ name }: { name: string }) => <div>{name}</div>
```

Pairs with `server-dedup-props`. Keep client-component props narrow and primitive where you can.
