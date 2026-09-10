---
title: Use passive listeners for touch/wheel events
impact: MEDIUM
tags: [client, event-listeners, scrolling, touch, wheel]
---

## Mark scroll-related listeners passive

Add `{ passive: true }` to `touchstart`/`touchmove`/`wheel` listeners that don't call
`preventDefault()`. Without it the browser must wait for the handler before scrolling, adding
input delay.

**Incorrect:**

```ts
useEffect(() => {
  const onWheel = (e: WheelEvent) => track(e.deltaY)
  document.addEventListener('wheel', onWheel)
  return () => document.removeEventListener('wheel', onWheel)
}, [])
```

**Correct:**

```ts
useEffect(() => {
  const onWheel = (e: WheelEvent) => track(e.deltaY)
  document.addEventListener('wheel', onWheel, { passive: true })
  return () => document.removeEventListener('wheel', onWheel)
}, [])
```

**Passive** for tracking/analytics/logging that never prevents default. **Not passive** when you
implement custom swipe/zoom or otherwise need `preventDefault()`.
