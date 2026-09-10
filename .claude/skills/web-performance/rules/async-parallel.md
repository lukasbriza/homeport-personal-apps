---
title: Run independent async operations in parallel
impact: CRITICAL
tags: [async, parallelization, waterfalls]
---

## Parallelize independent awaits

If async operations don't depend on each other, run them concurrently with `Promise.all`
instead of awaiting one by one — sequential awaits create a waterfall (N round trips).

**Incorrect — sequential, 3 round trips:**

```ts
const user = await fetchUser()
const posts = await fetchPosts()
const comments = await fetchComments()
```

**Correct — parallel, 1 round trip:**

```ts
const [user, posts, comments] = await Promise.all([fetchUser(), fetchPosts(), fetchComments()])
```

**In this repo:** applies in Next Server Components / route handlers and in NestJS services.
Parallelize only truly independent calls — if one needs another's result, keep the await chain.
