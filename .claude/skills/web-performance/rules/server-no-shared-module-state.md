---
title: Never store request data in module-level state on the server
impact: HIGH
tags: [server, rsc, ssr, concurrency, security]
---

## Module scope is process-wide, not request-local

On the server, module-level variables are shared across all concurrent renders. Writing
request-scoped data (the current user, request context) into module state leaks one user's data
into another's response. Pass request data down the tree instead.

**Incorrect — `currentUser` leaks across overlapping requests:**

```tsx
let currentUser: User | null = null

const Page = async () => {
  currentUser = await auth()
  return <Dashboard />
}

const Dashboard = () => <div>{currentUser?.name}</div>
```

**Correct — keep it local to the render tree:**

```tsx
const Page = async () => {
  const user = await auth()
  return <Dashboard user={user} />
}

const Dashboard = ({ user }: { user: User | null }) => <div>{user?.name}</div>
```

Safe at module scope: immutable config/assets loaded once (`server-hoist-static-io`), caches
keyed correctly for cross-request reuse, and stateless singletons. Never per-user/per-request
mutable data.
