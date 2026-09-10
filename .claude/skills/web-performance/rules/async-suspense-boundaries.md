---
title: Stream with Suspense instead of blocking on data
impact: HIGH
tags: [async, suspense, streaming, rsc]
---

## Wrap slow data in Suspense, don't block the layout

In Server Components, don't `await` data before returning the whole layout — wrap only the slow
part in `<Suspense>` so the shell paints immediately and data streams in.

**Incorrect — the whole page waits for data:**

```tsx
const Page = async () => {
  const data = await fetchData() // blocks Sidebar/Header/Footer too

  return (
    <div>
      <Sidebar />
      <Header />
      <DataDisplay data={data} />
      <Footer />
    </div>
  )
}
```

**Correct — shell renders now, only `DataDisplay` waits:**

```tsx
import { Suspense } from 'react'

const Page = () => (
  <div>
    <Sidebar />
    <Header />
    <Suspense fallback={<Skeleton />}>
      <DataDisplay />
    </Suspense>
    <Footer />
  </div>
)

const DataDisplay = async () => {
  const data = await fetchData() // only this subtree suspends
  return <div>{data.content}</div>
}
```

**Share one fetch across siblings** — start the promise in the parent, unwrap with `use()`:

```tsx
import { Suspense, use } from 'react'

const Page = () => {
  const dataPromise = fetchData() // start, don't await

  return (
    <Suspense fallback={<Skeleton />}>
      <DataDisplay dataPromise={dataPromise} />
      <DataSummary dataPromise={dataPromise} />
    </Suspense>
  )
}

const DataDisplay = ({ dataPromise }: { dataPromise: Promise<Data> }) => {
  const data = use(dataPromise)
  return <div>{data.content}</div>
}

const DataSummary = ({ dataPromise }: { dataPromise: Promise<Data> }) => {
  const data = use(dataPromise) // same promise → one fetch
  return <div>{data.summary}</div>
}
```

**Don't** use for layout-affecting or above-the-fold SEO content, tiny fast queries, or where the
loading→content jump (layout shift) hurts UX. Trade-off: faster paint vs layout shift.
