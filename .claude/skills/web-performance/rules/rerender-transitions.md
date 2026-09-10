---
title: Mark frequent non-urgent updates as transitions
impact: MEDIUM
tags: [rerender, transitions, startTransition]
---

## Wrap high-frequency, non-urgent state updates in startTransition

For updates that fire often and don't need to be immediate (scroll position, filtering a big list),
wrap them in `startTransition` so React can interrupt them and keep input responsive.

**Incorrect — every scroll blocks rendering:**

```tsx
useEffect(() => {
  const onScroll = () => setScrollY(window.scrollY)
  window.addEventListener('scroll', onScroll, { passive: true })
  return () => window.removeEventListener('scroll', onScroll)
}, [])
```

**Correct — non-blocking:**

```tsx
import { startTransition } from 'react'

useEffect(() => {
  const onScroll = () => startTransition(() => setScrollY(window.scrollY))
  window.addEventListener('scroll', onScroll, { passive: true })
  return () => window.removeEventListener('scroll', onScroll)
}, [])
```

For input-driven expensive renders, `useDeferredValue` is the sibling tool.
