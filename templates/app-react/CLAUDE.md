# CLAUDE.md — React (React Router) app

Per-app context. Inherits monorepo conventions from the root `CLAUDE.md`; this file
covers only what is specific to a React Router app.

## Stack

- **React Router v8 framework mode** (SSR), React 19, Vite, TypeScript.
- Data/state: **TanStack Query** with loader prefetch + hydration (`app/lib/query`);
  **Zustand** (SSR-safe provider, `app/stores`) for shared client UI state.
- API: shared **`@lukasbriza/api`** (`$api`), bound to the baseUrl once in `app/lib/api.ts`.
- Styling: **Emotion `styled`** (CSS-in-JS) with SSR critical-CSS extraction — same model as
  the Next app. Optional monorepo theme (`@lukasbriza/theme` / `@lukasbriza/styles`).

## Project structure — where things go

| Path | Holds |
|---|---|
| `app/entry.server.tsx` | ejected server render + Emotion critical-CSS extraction (`renderToString`) |
| `app/entry.client.tsx` | ejected client hydration wrapped in the Emotion `CacheProvider` |
| `app/root.tsx` | document shell (`Layout`) + app providers (`QueryProvider`, `UiStoreProvider`) |
| `app/routes.ts` | route config (`index`, `route`, `layout`, …) |
| `app/routes/<name>.tsx` | a route: `loader` (server), `action`, `meta`, default component. Types from `./+types/<name>` |
| `app/components/<name>/` | **one component per folder**: `<name>.tsx` + `<name>.styles.ts` + `index.ts` |
| `app/styles/` | **global** styles only (`global.tsx` — reset/tokens); component styles stay local |
| `app/lib/` | `api.ts` (binds `@lukasbriza/api` → `$api`), `query/` (Query client), `emotion/cache.ts` |
| `app/stores/` | Zustand stores (SSR-safe factory + provider + selector hook) |

Path alias `@/*` → `app/*` (`tsconfig.json` `paths` + Vite 8 native `resolve.tsconfigPaths`).

## Data & state

- **Server data**: fetch in route **`loader`s** (they run on the server). Prefetch into a Query
  client, `return { dehydratedState: dehydrate(queryClient) }`, wrap the subtree in
  `<HydrationBoundary state={loaderData.dehydratedState}>`; components use `$api.useQuery(...)` and
  read from the hydrated cache. Reference: `app/routes/home.tsx`.
- `getQueryClient()` is per-request on the server, a singleton in the browser — never a module
  singleton (leaks state between users).
- **Zustand (SSR-safe)**: factory + provider (`useState(createXxxStore)`) + selector hook — see
  `app/stores`. Full state-management decision tree lives in the `coding-conventions` skill.

## Styling

- **One component per folder.** `app/components/<name>/` holds `<name>.tsx` (arrow-const, named
  export), `<name>.styles.ts` (the component's Emotion `styled` definitions), and `index.ts`
  (`export * from './<name>'`). Import via the folder: `@/components/<name>`.
- **Emotion `styled`** for component styles — colocated in `<name>.styles.ts`, never inline in JSX.
  When consuming the monorepo theme, swap the raw `@emotion/styled` import for the theme-bound
  `styled` from `@lukasbriza/styles` and read colours/sizes from theme tokens (never hard-code).
- **Global** styles (reset, tokens) live in `app/styles/global.tsx` as an Emotion `<Global>` block,
  rendered once in `root.tsx`. Only genuinely app-wide rules go here — everything else stays local.
- Emotion infra (the cache factory) is `app/lib/emotion/cache.ts` — it's plumbing, not styling.
- **SSR trade-off:** Emotion critical-CSS extraction needs `renderToString`, so `entry.server.tsx`
  renders synchronously — this app gives up RR streaming SSR in exchange for flash-free styles. If
  you drop Emotion for a build-time solution (CSS Modules / Tailwind), delete the ejected entry
  files to restore the default streaming entry.

## Types & commands

- **Run `pnpm ts` (`react-router typegen` + `tsc`) before typecheck/lint** — React Router
  generates route types (`+types/*`, `.react-router/types/`) that the code imports.
- `pnpm dev` (Vite) · `pnpm build` · `pnpm start` (`react-router-serve`).
- API schema/types are owned by `@lukasbriza/api` (regenerate there); this app has no local schema.
- SSR is on (`react-router.config.ts` → `ssr: true`); set `ssr: false` there for a SPA build.

## Don't touch

- Generated: `build/`, `.react-router/`. API schema types live in `@lukasbriza/api`.
- This file ships from `templates/app-react/CLAUDE.md`; edit conventions there, not in
  scaffolded copies, so changes propagate via `turbo gen` / `sync-template`.
