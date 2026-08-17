---
title: Use a ternary, not &&, for conditional rendering
impact: LOW
tags: [rendering, jsx, conditional]
---

## Guard JSX with `cond ? … : null`, not `cond && …`

`{value && <X/>}` renders the falsy value itself when it's `0` or `NaN` (React renders numbers).
Use a ternary (or coerce to a real boolean) so nothing leaks into the DOM.

**Incorrect — renders `0` when `count === 0`:**

```tsx
const Badge = ({ count }: { count: number }) => <div>{count && <span className="badge">{count}</span>}</div>
```

**Correct — renders nothing when `count === 0`:**

```tsx
const Badge = ({ count }: { count: number }) => (
  <div>{count > 0 ? <span className="badge">{count}</span> : null}</div>
)
```

Same trap with `items.length && …` (renders `0` when empty). Strings/booleans are safe; numbers
aren't.
