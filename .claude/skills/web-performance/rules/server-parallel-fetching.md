---
title: Parallelize RSC data fetching via composition
impact: CRITICAL
tags: [server, rsc, parallel-fetching, composition]
---

## Fetch in sibling components, not in a parent that blocks children

An async parent that awaits before rendering its children serializes their fetches. Move each
fetch into its own async component so siblings fetch in parallel.

**Incorrect — `Sidebar` waits for the page's fetch:**

```tsx
const Page = async () => {
  const header = await fetchHeader()
  return (
    <div>
      <div>{header}</div>
      <Sidebar />
    </div>
  )
}

const Sidebar = async () => {
  const items = await fetchSidebarItems()
  return <nav>{items.map(renderItem)}</nav>
}
```

**Correct — each component fetches its own data; siblings run in parallel:**

```tsx
const Header = async () => {
  const data = await fetchHeader()
  return <div>{data}</div>
}

const Sidebar = async () => {
  const items = await fetchSidebarItems()
  return <nav>{items.map(renderItem)}</nav>
}

const Page = () => (
  <div>
    <Header />
    <Sidebar />
  </div>
)
```

The RSC-component version of `async-parallel`: co-locate each fetch with the component that uses
it, keep the parent sync. Combine with `async-suspense-boundaries` to stream them independently.
