---
title: Preload heavy bundles on user intent
impact: MEDIUM
tags: [bundle, preload, hover, prefetch]
---

## Warm up a lazy bundle on hover/focus

For a component you load lazily (`bundle-dynamic-imports`), kick off its `import()` on the first
sign of intent — hover or focus — so it's ready by the time the user clicks.

```tsx
const EditorButton = ({ onClick }: { onClick: () => void }) => {
  const preload = () => {
    if (typeof window !== 'undefined') void import('./monaco-editor')
  }

  return (
    <button type="button" onMouseEnter={preload} onFocus={preload} onClick={onClick}>
      Open editor
    </button>
  )
}
```

Same idea when a flag flips on: `void import('./monaco-editor')` in an effect keyed on the flag.
The `import()` is cached, so preloading + the later lazy load share one request. Keep the
`typeof window` guard so it doesn't land in the server bundle.
