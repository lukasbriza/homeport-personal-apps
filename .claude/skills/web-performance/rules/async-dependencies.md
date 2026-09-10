---
title: Start dependent promises early, await them together
impact: CRITICAL
tags: [async, parallelization, dependencies]
---

## Maximize parallelism with partial dependencies

When some operations depend on others, don't serialize the whole chain. Create each promise as
early as possible (a dependent one chains off its parent's promise) and `await` them together,
so independent work overlaps.

**Incorrect — `profile` waits for `config` unnecessarily:**

```ts
const [user, config] = await Promise.all([fetchUser(), fetchConfig()])
const profile = await fetchProfile(user.id)
```

**Correct — `config` and `profile` run in parallel:**

```ts
const userPromise = fetchUser()
const profilePromise = userPromise.then((user) => fetchProfile(user.id))

const [user, config, profile] = await Promise.all([userPromise, fetchConfig(), profilePromise])
```

`profile` starts as soon as `user` resolves, while `config` runs the whole time. Extends
`async-parallel` to graphs with partial dependencies — no extra library needed.
