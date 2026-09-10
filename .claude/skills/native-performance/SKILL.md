---
name: native-performance
description: React Native / Expo performance guidelines for this monorepo. Apply when writing, reviewing, or refactoring Expo/RN screens, lists, animations (Reanimated/Gesture Handler), images, or anything on the native runtime (JS↔native bridge, UI thread, Metro). Complements `coding-conventions` (references/react-native.md); the web axis is the separate `web-performance` skill.
---

# React Native / Expo performance

Rules for the **native runtime** — the JS↔native bridge, the UI (compositor) thread, and Metro.
This is the native performance axis; web/Next performance lives in `web-performance`, and
correctness/conventions in `coding-conventions` (references/react-native.md). When a task touches
one of these areas, read the specific `rules/<name>.md` for the why + before/after.

## Rules

### Lists — CRITICAL
- `list-virtualize` — render long/unbounded lists with `FlatList`/`FlashList`, never `.map()` inside a `ScrollView`.
- `list-render-item-stable` — memoize the row component and keep `renderItem` / `keyExtractor` stable (no inline).

### Animations (Reanimated) — HIGH
- `animation-gpu-props` — animate `transform` / `opacity` (compositor), not layout props (`width`/`height`/`top`).
- `animation-ui-thread` — hold animation values in `useSharedValue` / `useDerivedValue`; never bounce through React state.
- `scroll-position-no-state` — drive scroll-linked UI from a shared value, not `useState` (avoids per-frame re-renders).
- `animation-gestures` — use the Gesture API (`GestureDetector`) for interactive animations, not `PanResponder`.

### Images — MEDIUM
- `image-expo-image` — use `expo-image` for remote/large images (disk+memory cache, priority, downscaling).
