---
title: Use the Gesture API for interactive animations
impact: MEDIUM
tags: [animation, gestures, reanimated]
---

## GestureDetector + Reanimated, not PanResponder

`react-native-gesture-handler`'s Gesture API runs on the UI thread and composes with Reanimated
shared values, so drags/pinches stay smooth without bridge round-trips. `PanResponder` (and
animating from its JS callbacks) runs on the JS thread and stutters under load.

**Avoid:**

```tsx
const responder = PanResponder.create({
  onPanResponderMove: (_, g) => setPos({ x: g.dx, y: g.dy }), // JS thread + re-render
})
```

**Prefer:**

```tsx
const x = useSharedValue(0)
const pan = Gesture.Pan().onChange((e) => {
  x.value += e.changeX // worklet, UI thread
})

<GestureDetector gesture={pan}>
  <Animated.View style={useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }))} />
</GestureDetector>
```

`GestureHandlerRootView` must wrap the app (root `_layout`) for gestures to register.
