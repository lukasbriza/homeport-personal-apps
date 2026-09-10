---
title: Put user-action logic in the event handler, not an effect
impact: MEDIUM
tags: [rerender, useEffect, events]
---

## Run action side effects in the handler

If a side effect is caused by a specific user action (submit/click), run it in that handler. Don't
model it as `state → useEffect`; the effect re-runs on unrelated dep changes and can fire twice.

**Incorrect — action modeled as state + effect:**

```tsx
const Form = () => {
  const [submitted, setSubmitted] = useState(false)
  const theme = useContext(ThemeContext)

  useEffect(() => {
    if (submitted) {
      void post('/api/register')
      showToast('Registered', theme)
    }
  }, [submitted, theme])

  return (
    <button type="button" onClick={() => setSubmitted(true)}>
      Submit
    </button>
  )
}
```

**Correct — do it in the handler:**

```tsx
const Form = () => {
  const theme = useContext(ThemeContext)

  const handleSubmit = () => {
    void post('/api/register')
    showToast('Registered', theme)
  }

  return (
    <button type="button" onClick={handleSubmit}>
      Submit
    </button>
  )
}
```
