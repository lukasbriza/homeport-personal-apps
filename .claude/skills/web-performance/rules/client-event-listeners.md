---
title: Share one global event listener across hook instances
impact: LOW
tags: [client, event-listeners, subscription]
---

## One window listener, not one per hook call

A hook that does `window.addEventListener` in `useEffect` registers a new listener per instance.
For global events (keydown, resize, scroll) used by many components, keep a module-level registry
and install a single listener.

```ts
const callbacks = new Set<(e: KeyboardEvent) => void>()
let installed = false

const ensureListener = () => {
  if (installed || typeof window === 'undefined') return
  window.addEventListener('keydown', (e) => callbacks.forEach((cb) => cb(e)))
  installed = true
}

export const useKeydown = (onKey: (e: KeyboardEvent) => void) => {
  useEffect(() => {
    ensureListener()
    callbacks.add(onKey)
    return () => {
      callbacks.delete(onKey)
    }
  }, [onKey])
}
```

Now N components share one `keydown` listener. Pass a **stable** `onKey` (memoized) so the effect
doesn't churn. The single listener is an intentional module-level singleton, not per-request state.
