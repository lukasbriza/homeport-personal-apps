---
title: Don't subscribe to state you only read in callbacks
impact: MEDIUM
tags: [rerender, searchparams, hooks]
---

## Read on demand instead of subscribing

Hooks like `useSearchParams` subscribe the component to every change. If you only read the value
inside an event handler, read it on demand — no subscription, no re-render on unrelated changes.

**Incorrect — re-renders on every searchParams change:**

```tsx
const ShareButton = ({ chatId }: { chatId: string }) => {
  const searchParams = useSearchParams()

  const handleShare = () => {
    shareChat(chatId, { ref: searchParams.get('ref') })
  }

  return (
    <button type="button" onClick={handleShare}>
      Share
    </button>
  )
}
```

**Correct — read at the point of use:**

```tsx
const ShareButton = ({ chatId }: { chatId: string }) => {
  const handleShare = () => {
    const ref = new URLSearchParams(window.location.search).get('ref')
    shareChat(chatId, { ref })
  }

  return (
    <button type="button" onClick={handleShare}>
      Share
    </button>
  )
}
```

Applies to any subscribing hook (search params, context selectors, store hooks) whose value is
only needed inside handlers.
