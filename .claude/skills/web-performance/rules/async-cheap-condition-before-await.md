---
title: Check cheap sync conditions before awaiting flags
impact: HIGH
tags: [async, await, feature-flags, short-circuit]
---

## Guard awaits with cheap conditions

When a branch awaits a flag/remote value AND also needs a cheap synchronous condition
(local props, request metadata, already-loaded state), check the cheap condition first —
otherwise you pay for the async call even on the cold path where the compound check can
never be true.

**Incorrect — always awaits the flag:**

```ts
const flag = await getFlag()
if (flag && isEligible) {
  // ...
}
```

**Correct — skip the flag fetch when the cheap guard fails:**

```ts
if (isEligible) {
  const flag = await getFlag()
  if (flag) {
    // ...
  }
}
```

Matters when the await hits the network, a feature-flag service, `React.cache`, or the DB.
Keep the original order if the cheap condition is actually expensive, depends on the flag,
or side effects must run in a fixed order.
