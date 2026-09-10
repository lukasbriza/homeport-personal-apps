---
title: Lazy-initialize expensive useState values
impact: MEDIUM
tags: [rerender, useState, initialization]
---

## Pass a function to useState for expensive initial values

`useState(expensive())` runs `expensive()` on every render (the result is only used once). Pass a
function so it runs on the first render only.

**Incorrect — runs on every render:**

```tsx
const [index, setIndex] = useState(buildSearchIndex(items))
```

**Correct — runs once:**

```tsx
const [index, setIndex] = useState(() => buildSearchIndex(items))
```

Use for building indexes/maps, parsing localStorage, reading the DOM, or heavy transforms. Not
needed for primitives or cheap literals (`useState(0)`, `useState({})`).
