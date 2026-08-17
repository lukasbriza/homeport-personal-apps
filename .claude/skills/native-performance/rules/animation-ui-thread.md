---
title: Keep animation values on the UI thread
impact: HIGH
tags: [animation, reanimated, rerender]
---

## Shared/derived values, not React state

Driving an animation from `useState` re-renders the component on **every frame** and hops the
JS↔native bridge. Keep animated values in `useSharedValue`; compute dependent values with
`useDerivedValue` — both live on the UI thread and never trigger a React render.

**Avoid:**

```tsx
const [x, setX] = useState(0)
useEffect(() => {
  const id = setInterval(() => setX((v) => v + 1), 16) // re-render every frame
  return () => clearInterval(id)
}, [])
```

**Prefer:**

```tsx
const x = useSharedValue(0)
const shadow = useDerivedValue(() => x.value * 0.5) // stays on the UI thread
useEffect(() => {
  x.value = withRepeat(withTiming(100, { duration: 1000 }), -1, true)
}, [x])
```

Read shared values only inside worklets (`useAnimatedStyle`, `useDerivedValue`, gesture callbacks).
To pull a value back to JS deliberately, use `runOnJS`.
