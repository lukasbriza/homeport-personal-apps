---
title: Lazy-load heavy components with next/dynamic
impact: CRITICAL
tags: [bundle, dynamic-import, code-splitting]
---

## Defer heavy components off the initial bundle

Load large components that aren't needed for first paint with `next/dynamic`, so they don't
ship in the main chunk (helps TTI/LCP).

**Incorrect — the editor bundles with the main chunk:**

```tsx
import { MonacoEditor } from './monaco-editor'

const CodePanel = ({ code }: { code: string }) => <MonacoEditor value={code} />
```

**Correct — loaded on demand:**

```tsx
import dynamic from 'next/dynamic'

const MonacoEditor = dynamic(() => import('./monaco-editor').then((m) => m.MonacoEditor), {
  ssr: false,
})

const CodePanel = ({ code }: { code: string }) => <MonacoEditor value={code} />
```

Use `ssr: false` for client-only widgets (editors, charts, maps). Pair with a `loading`
fallback for perceived speed. Don't dynamic-import small or above-the-fold components — the
extra request isn't worth it.
