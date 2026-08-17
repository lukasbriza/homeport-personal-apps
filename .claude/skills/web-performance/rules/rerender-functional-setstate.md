---
title: Use functional setState when it depends on current state
impact: MEDIUM
tags: [rerender, useState, useCallback, closures]
---

## `setX(curr => …)` avoids stale closures and unstable callbacks

When the next state depends on the current state, use the updater form. It removes the state from
the callback's deps (stable reference, fewer child re-renders) and can't read a stale value.

**Incorrect — `items` dep recreates the callback / risks a stale closure:**

```tsx
const addItems = useCallback((next: Item[]) => setItems([...items, ...next]), [items])
```

**Correct — stable, always latest:**

```tsx
const addItems = useCallback((next: Item[]) => setItems((curr) => [...curr, ...next]), [])
```

Use whenever `setState` reads the previous value (handlers, async, inside `useCallback`/`useMemo`).
The direct form is fine for static values or values that come only from arguments/props.
