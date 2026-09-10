---
title: Drive scroll-linked UI from a shared value, not state
impact: HIGH
tags: [animation, scroll, reanimated, rerender]
---

## Scroll position belongs in a shared value

Storing scroll offset in `useState` (via `onScroll` + `setState`) re-renders the screen on every
scroll frame — the classic RN jank. Capture it with `useAnimatedScrollHandler` into a shared value
and read it in worklets.

**Avoid:**

```tsx
const [offset, setOffset] = useState(0)
<ScrollView onScroll={(e) => setOffset(e.nativeEvent.contentOffset.y)} scrollEventThrottle={16}>
```

**Prefer:**

```tsx
const offset = useSharedValue(0)
const onScroll = useAnimatedScrollHandler((e) => {
  offset.value = e.contentOffset.y
})

const headerStyle = useAnimatedStyle(() => ({ opacity: interpolate(offset.value, [0, 100], [1, 0]) }))

<Animated.ScrollView onScroll={onScroll} scrollEventThrottle={16}>
```

Same rule for any per-frame gesture/animation signal: keep it off React state.
