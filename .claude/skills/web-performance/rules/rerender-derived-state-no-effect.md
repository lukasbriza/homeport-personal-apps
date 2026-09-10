---
title: Derive state during render, not in an effect
impact: MEDIUM
tags: [rerender, derived-state, useEffect]
---

## Compute derived values inline; don't mirror them in state

If a value can be computed from current props/state, compute it during render. Don't store it in
`useState` and sync it with `useEffect` — that adds a render and lets the copy drift.

**Incorrect — redundant state + effect:**

```tsx
const Form = () => {
  const [firstName, setFirstName] = useState('First')
  const [lastName, setLastName] = useState('Last')
  const [fullName, setFullName] = useState('')

  useEffect(() => {
    setFullName(`${firstName} ${lastName}`)
  }, [firstName, lastName])

  return <p>{fullName}</p>
}
```

**Correct — derive during render:**

```tsx
const Form = () => {
  const [firstName, setFirstName] = useState('First')
  const [lastName, setLastName] = useState('Last')
  const fullName = `${firstName} ${lastName}`

  return <p>{fullName}</p>
}
```

(This is the perf statement of the `coding-conventions` skill (references/react.md) "derive, don't mirror". To reset state on a prop
change, prefer a `key` over an effect.)
