---
title: Avoid barrel-file imports from large libraries
impact: CRITICAL
tags: [bundle, imports, tree-shaking, barrel-files]
---

## Don't import large libraries through their barrel file

A barrel file re-exports many modules (`index.js` doing `export * from …`). Icon/component
libraries can have thousands of re-exports; importing through the barrel loads them all —
200–800 ms per cold start and much slower dev/builds, because tree-shaking can't help.

**Incorrect — pulls the whole library:**

```tsx
import { Button, TextField } from '@mui/material' // loads ~2,000+ modules
```

**Correct — Next apps: let Next rewrite barrel imports at build time (keep clean imports):**

```js
// next.config.mjs
const nextConfig = {
  experimental: {
    optimizePackageImports: ['@mui/material', '@mui/icons-material', 'lucide-react'],
  },
}
```

```tsx
import { Button, TextField } from '@mui/material' // Next transforms to direct imports; types intact
```

**Correct — non-Next code (e.g. the component library): import from the source path:**

```tsx
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
```

**In this repo:** add heavy libs (MUI, icon packs) to `optimizePackageImports` in each Next app.
Our own small packages (`@lukasbriza/theme|styles|components`) are fine imported via their
`index` — few exports, no barrel cost. Watch the TS caveat: some libs (e.g. `lucide-react`)
don't ship types for deep paths, so prefer `optimizePackageImports` over hand-written subpaths.
