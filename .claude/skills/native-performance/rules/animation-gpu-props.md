---
title: Animate transform/opacity, not layout props
impact: HIGH
tags: [animation, reanimated, ui-thread]
---

## Animate compositor properties

`transform` (translate/scale/rotate) and `opacity` are handled by the compositor and stay at 60/120fps.
Animating layout props (`width`, `height`, `top`, `margin`, `flex`) forces layout + paint every frame
and drops frames. Reframe size/position animations as transforms.

**Avoid:**

```tsx
const style = useAnimatedStyle(() => ({ width: w.value, top: y.value })) // layout every frame
```

**Prefer:**

```tsx
const style = useAnimatedStyle(() => ({
  transform: [{ translateY: y.value }, { scaleX: scale.value }],
  opacity: o.value,
}))
```

Need a genuine layout change (list insert/remove, container resize)? Use Reanimated **layout
animations** / `entering`/`exiting` instead of hand-animating layout props.
