---
title: Don't fetch in useEffect; fetch on the server
impact: MEDIUM-HIGH
tags: [client, data-fetching, rsc]
---

## Prefer server fetching over client `useEffect` fetches

Fetching in `useEffect` runs after render (waterfall), doesn't dedupe across instances, and
ships fetch logic to the client. Fetch in a Server Component and pass data down; use the typed
`$api` client (`@/lib/api`, from `@lukasbriza/api`) for calls that must happen on the client.

**Avoid:**

```tsx
const UserList = () => {
  const [users, setUsers] = useState<User[]>([])
  useEffect(() => {
    void fetch('/api/users').then((r) => r.json()).then(setUsers)
  }, [])
  // ...
}
```

**Prefer — fetch on the server, pass down:**

```tsx
const Page = async () => {
  const users = await getUsers()
  return <UserList users={users} />
}
```

If you genuinely need client-side fetching with caching/dedup across components, add a data
library (e.g. SWR or TanStack Query) deliberately — don't hand-roll `useEffect` fetching.
