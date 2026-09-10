# CLAUDE.md — Mobile (Expo / React Native) app

Per-app context. Inherits monorepo conventions from the root `CLAUDE.md`; this file
covers only what is specific to an Expo app. RN conventions/correctness live in the
`coding-conventions` skill (`references/react-native.md`); RN performance (lists, Reanimated,
images) in the `native-performance` skill.

## Stack

- **Expo SDK 56** (managed) + **Expo Router** (file-based routing), React Native 0.85,
  React 19, TypeScript.
- Data/state: **TanStack Query** (`lib/query`) + **Zustand** (`stores`) — same libraries
  as the web templates, so business logic ports across.
- API: shared **`@lukasbriza/api`** (`$api`), bound to the env baseUrl once in `lib/api.ts`.
- Styling: **@emotion/native** `styled` — the RN analogue of the web templates' Emotion.

## Project structure — where things go

| Path | Holds |
|---|---|
| `app/` | **routes only** (Expo Router). `_layout.tsx` = providers + navigator; `<name>.tsx` = a screen (default export); `+not-found.tsx` = unmatched-route screen |
| `app/<name>.styles.ts` | route-level styles (`@emotion/native`) |
| `components/<name>/` | **one component per folder**: `<name>.tsx` + `<name>.styles.ts` + `index.ts` (e.g. `error-boundary/`) |
| `lib/` | `api.ts` (binds `@lukasbriza/api` → `$api`), `query/` (single QueryClient), `env.ts` |
| `stores/` | Zustand stores (factory + provider + selector hook) |
| `theme/` | design tokens (`index.ts` — light/dark) + Emotion `Theme` typing (`emotion.d.ts`) |
| `eas.json` | EAS Build profiles (development / preview / production) |
| `.env.example` | `EXPO_PUBLIC_*` config template → copy to `.env.local` |

Path alias `@/*` → repo-relative `./*` (`tsconfig.json` `paths`). Native config
(`metro.config.js`, `babel.config.js`) is CommonJS, so this app is **not** `"type": "module"`.

## Styling

- **@emotion/native** `styled` — same DX as the web `.styles.ts` convention, but RN
  primitives: `styled.View` / `styled.Text` (not `div`/`span`), RN style semantics
  (unitless numbers, RN `flex`/`gap`), no CSS cascade. **No SSR/registry** — RN renders
  on-device, so there is nothing to extract (much simpler than the web Emotion setup).
- One component per folder; styles colocated in `<name>.styles.ts`, never inline.
- **Theme & dark mode**: tokens live in `theme/index.ts` (`lightTheme`/`darkTheme`); `_layout`
  picks one via `useColorScheme()` and provides it through Emotion's `ThemeProvider`. Read tokens
  in styles via `${({ theme }) => theme.colors.text}` — never hard-code colours/sizes.
- Token VALUES come from the shared **`@lukasbriza/tokens`** package (framework-free), so colours
  and scales match the web. `theme/index.ts` only composes light/dark from them. **MUI's
  theme/`styled` are web-only — not usable here.**

## Navigation & robustness

- **Typed routes** are on (`app.json` → `experiments.typedRoutes`). `<Link href>` / `router.push`
  become route-typed after the first `expo start` generates `.expo/types`.
- **Error boundary**: `components/error-boundary` is re-exported as `ErrorBoundary` from
  `app/_layout.tsx` — Expo Router's app-wide crash fallback.
- **Reanimated smoke test**: the FadeIn on the home title verifies the worklets/Reanimated Babel
  plugin is wired. If it doesn't animate, see `babel.config.js`.

## Data & state

- **Server data**: `$api.useQuery(...)` inside components (`$api` from `lib/api`). No SSR
  prefetch/hydration like the web — RN fetches on mount. One app-lifetime `QueryClient`
  (`lib/query/query-client.ts`); no per-request split.
- **Zustand**: factory + provider + selector hook (`stores`) — same pattern as the web
  templates. Decision tree for state lives in the `coding-conventions` skill.
- No React Query devtools (web-only); use Flipper / RN devtools plugin on device.

## Setup, types & commands

- **After scaffolding, add the router runtime deps** (native peers of `expo-router`, kept out
  of `package.json` so their versions track the SDK, not hand-pins). The root `.npmrc`-level
  `pnpm.peerDependencyRules.ignoreMissing` lets the first `pnpm install` pass before this runs:

  ```
  expo install expo-linking expo-constants expo-status-bar expo-system-ui \
    react-native-safe-area-context react-native-screens \
    react-native-reanimated react-native-worklets react-native-gesture-handler react-native-web
  ```

  (`react-native-worklets` is a required runtime peer of Reanimated 4 — it split the
  worklets engine into its own package.)

- Then **`expo install --fix`** pins every Expo-managed dependency (expo, expo-router,
  react-native, …) to the exact versions the installed SDK expects. Do **not** hand-bump those.
- **Exception — `react` and `typescript` are owned by the monorepo, not Expo.** `expo install
  --fix` will try to pull `react` down to the SDK's exact patch and push `typescript` up; keep
  `react` at the workspace version (so it matches `react-dom` and the web apps) and `typescript`
  at the workspace version (Expo's bump breaks `openapi-typescript`'s `^5` peer). Re-set them if
  a `--fix` run moves them.
- `@react-native/metro-config` is a required devDep (peer of RN's CLI plugin + Reanimated worklets).
- `pnpm ts` (`tsc`) · `pnpm lint` · `pnpm start` (Metro) · `pnpm ios` / `pnpm android`.
- API schema types are owned by `@lukasbriza/api` (regenerate there); this app has no local schema.
- `@lukasbriza/api` + `@lukasbriza/tokens` are library packages — build them before this app's
  `tsc`/Metro can resolve their `dist` (`turbo` handles `^build` ordering; build manually otherwise).

## Monorepo / Metro notes

- The root `.npmrc` hoists **only** expo/react-native/metro to the workspace root
  (`public-hoist-pattern`) so Metro + native autolinking resolve them; the rest of the
  workspace keeps pnpm's strict isolation.
- `metro.config.js` is monorepo-aware (`watchFolders` = repo root, `nodeModulesPaths` =
  app + root). Edit it if you add shared packages Metro must follow.

## Recipes — enable when needed (kept out of the template on purpose)

Each of these needs its own `expo install` (a new native dep breaks `pnpm install`/`tsc` until
present) or an account/asset, so they're documented rather than pre-wired.

- **Offline cache (Query + Zustand persistence)** — `expo install @react-native-async-storage/async-storage`;
  `pnpm add @tanstack/react-query-persist-client @tanstack/query-async-storage-persister`. Swap
  `QueryClientProvider` for `PersistQueryClientProvider` (AsyncStorage persister) in
  `lib/query/providers.tsx`; wrap Zustand stores in the `persist` middleware with an AsyncStorage adapter.
- **Fonts / splash / icon** — `expo install expo-font expo-splash-screen`; add `.ttf` assets under
  `assets/fonts`, load with `useFonts` in `_layout` and hold the splash until ready. Icon/splash images
  are binary assets you provide in `app.json`.
- **Testing** — `expo install jest-expo`; `pnpm add -D jest @testing-library/react-native react-test-renderer`.
  Add `jest.config.js` (`preset: 'jest-expo'`) + a `test` script; mirror the web test conventions.
- **OTA updates** — `expo install expo-updates`; needs an EAS project id (`eas init`). Configure the
  `updates` block in `app.json`.
- **Crash/error reporting** — e.g. `@sentry/react-native`; needs a Sentry DSN. Wire in `_layout`.
  Not pre-added: it requires an account and a secret.

## Don't touch

- Generated: `.expo/`, `dist/`, `ios/`, `android/`. API schema types live in `@lukasbriza/api`.
- This file ships from `templates/app-mobile/CLAUDE.md`; edit conventions there, not in
  scaffolded copies, so changes propagate via `turbo gen` / `sync-template`.
