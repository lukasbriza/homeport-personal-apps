# React Native (Expo) conventions

Read with `coding-conventions` (base) and `react.md`. Applies to `apps/*` Expo apps
(`app-mobile`). Performance (lists, animations, images) lives in the `native-performance` skill.

## Rendering — RN crashes on these

- **Text only inside `<Text>`.** A raw string or number rendered directly under a `View`
  throws (`Text strings must be rendered within a <Text> component`). Wrap every literal.
- **Never `{cond && <X/>}` when `cond` can be `0` / `''` / `NaN`.** In RN a falsy `0`/`''`
  reaches the tree as a bare string and crashes (worse than the web). Use a ternary or coerce:

```tsx
{items.length ? <List /> : null}   // ✅
{!!items.length && <List />}        // ✅
{items.length && <List />}          // ❌ renders `0` → crash
```

## Interaction & layout

- **`Pressable`**, not `TouchableOpacity`/`TouchableHighlight` (deprecated ergonomics).
  Style/opacity via the `pressed` state.
- **Safe area** via `react-native-safe-area-context`: `SafeAreaProvider` at the root,
  `SafeAreaView` with explicit `edges` or `useSafeAreaInsets()`. Never hard-code status-bar
  or home-indicator padding.
- **`GestureHandlerRootView`** must wrap the app (root layout) — required by gesture-handler
  and Reanimated. See `app-mobile/app/_layout.tsx`.

## Navigation — Expo Router

- File-based: routes live in `app/`, `_layout.tsx` = providers + navigator, `+not-found.tsx`
  for unmatched routes. Everything non-route lives outside `app/` (`components/`, `lib/`, …).
- **Typed routes** on (`app.json` → `experiments.typedRoutes`); `<Link href>` / `router.push`
  are route-typed after the first `expo start` generates `.expo/types`.
- Route files **default-export** the screen (arrow const). App-wide `ErrorBoundary` is a named
  export re-exported from the root `_layout`.

## Styling & images

- **`@emotion/native`** `styled` (see `react.md` → Styling): `styled.View`/`styled.Text`,
  colours/scales from the theme (`${({ theme }) => …}`), tokens from `@lukasbriza/tokens`.
  No StyleSheet objects and no inline `style={{…}}` for anything reusable.
- **`expo-image`**, not RN `Image` — disk/memory caching, `contentFit`, `priority`,
  `placeholder`/blurhash. (Perf rationale: `native-performance` → `image-expo-image`.)

## Fonts & env

- Load custom fonts with **`expo-font`** (`useFonts` in the root layout; hold the splash until
  ready) — see the fonts recipe in `app-mobile/CLAUDE.md`.
- Public config via `EXPO_PUBLIC_*` (`lib/env.ts`); never ship secrets in the bundle.

## Monorepo (already wired — don't re-derive)

- **Native deps belong to the app**, never to shared JS packages. `@lukasbriza/api`/`tokens`
  stay pure TS; `expo-*` / `react-native-*` live in `app-mobile`.
- **One version** of `react` / `react-native` across the workspace (owned by the monorepo, not
  bumped per-`expo install --fix`). Metro resolution relies on the surgical `public-hoist-pattern`
  in the root `.npmrc`. Details: `app-mobile/CLAUDE.md`.

## Common Mistakes

| Mistake | Instead |
|---|---|
| Raw text/number under a `View` | wrap in `<Text>` |
| `{count && <X/>}` | `count ? <X/> : null` |
| `TouchableOpacity` | `Pressable` |
| Hard-coded notch padding | `SafeAreaView` `edges` / insets |
| RN `Image` for remote/large images | `expo-image` |
| `StyleSheet.create` / inline styles | `@emotion/native` `styled` + tokens |
| Native dep in a shared package | keep it in the app |
