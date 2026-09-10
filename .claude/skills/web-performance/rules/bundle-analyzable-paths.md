---
title: Keep import and file paths statically analyzable
impact: HIGH
tags: [bundle, dynamic-import, file-tracing, nextjs]
---

## Make paths literal so the bundler can see them

Build tools narrow what they include only when paths are obvious at build time. Hiding the real
path in a variable forces the tool to bundle a broad set of candidates (or widen Next's file
tracing) — bigger server bundles, slower builds, worse cold starts.

**Dynamic imports — incorrect (bundler can't tell what's imported):**

```ts
const PAGE_MODULES = {
  home: './pages/home',
  settings: './pages/settings',
} as const

const Page = await import(PAGE_MODULES[pageName])
```

**Correct — an explicit map of `() => import(...)`:**

```ts
const PAGE_MODULES = {
  home: () => import('./pages/home'),
  settings: () => import('./pages/settings'),
} as const

const Page = await PAGE_MODULES[pageName]()
```

**File-system paths — incorrect (final path hidden from analysis):**

```ts
const baseDir = path.join(process.cwd(), `content/${contentKind}`)
```

**Correct — literal path per branch:**

```ts
const baseDir =
  kind === ContentKind.Blog
    ? path.join(process.cwd(), 'content/blog')
    : path.join(process.cwd(), 'content/docs')
```

**In this repo:** matters in Next server code — `import`, `require`, and `fs` on a composed
variable can widen output file tracing.
