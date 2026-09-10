---
title: Load large modules/data only when the feature is used
impact: HIGH
tags: [bundle, conditional-loading, lazy-loading]
---

## Import heavy modules on activation, not upfront

Pull in large data or modules only once a feature is actually enabled, with a dynamic `import()`.

```tsx
const AnimationPlayer = ({ enabled }: { enabled: boolean }) => {
  const [frames, setFrames] = useState<Frame[] | null>(null)

  useEffect(() => {
    if (!enabled || frames || typeof window === 'undefined') return
    void import('./animation-frames').then((mod) => setFrames(mod.frames))
  }, [enabled, frames])

  if (!frames) return <Skeleton />
  return <Canvas frames={frames} />
}
```

The `typeof window === 'undefined'` guard keeps the heavy module out of the SSR/server bundle.
This is one of the few legit uses of `useEffect` — a real side effect (loading an external
module) triggered by a flag, not state syncing.
