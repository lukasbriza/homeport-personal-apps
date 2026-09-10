# Next.js (App Router) conventions

Read with `coding-conventions` (base) and `react.md`. Applies to `apps/*` Next apps.
Performance rules (RSC waterfalls, bundle, streaming) live in the `web-performance` skill.

## Structure — thin routes, real code in `src/`

`src/app/` holds **only thin route files that re-export** the real implementation:

```ts
// src/app/[locale]/layout.ts
export { RootLayout as default, generateMetadata, generateStaticParams } from '@/layout/root-layout'
```

| Lives in | What |
|---|---|
| `src/app/[locale]/**` | route files — re-export only, no logic |
| `src/modules/<feature>/` | feature pages/components (`page.tsx`, etc.) |
| `src/layout/**` | layouts + emotion SSR `registry/` |
| `src/i18n/**` | next-international config, `client`, `server`, `locales/` |
| `src/lib/api.ts` | binds shared `@lukasbriza/api` → `$api` |
| `src/shared/types.ts` | shared route types |

Import via the `@/*` alias, never long relative paths.

## Server vs client components

- Server Component by default. Add `'use client'` only for interactivity/browser APIs, as low in
  the tree as possible.
- Data fetching in Server Components (`async` page). See `web-performance`: `client-fetch-on-server`.

## Route types

Type pages/layouts with the shared aliases from `src/shared/types.ts`, don't re-declare:
`WebPage`, `AsyncWebLayout`, `WebPageProps`, `WebPageParams`.

```tsx
export const HomePage: WebPage = async () => {
  const t = await getScopedI18n('home')
  return <main><h1>{t('title')}</h1></main>
}
```

## Metadata & caching

- Metadata via the Metadata API — `export const metadata` or `async generateMetadata()`. Never
  `next/head`.
- Optional metadata fields under `exactOptionalPropertyTypes` need `?? null` (e.g. `robots`).
- Segment cache with `export const dynamic = 'force-dynamic'` / `revalidate` — explicitly.

## i18n (next-international)

- Server: `getScopedI18n` / `getI18n` from `@/i18n/server`. Client: `useScopedI18n` /
  `I18nProviderClient` from `@/i18n/client`.
- Locales in `src/i18n/locales/<locale>.ts`; add a locale in one place (`i18n/config.ts`).
- The `middleware.ts` matcher must be a **plain string literal** (Next statically parses it —
  no `String.raw`, no computed value).

## Env & API

- Runtime env via `next-runtime-env`: `env('NEXT_PUBLIC_…')` + `<PublicEnvScript />` in the root
  layout. Don't read `process.env` in client components.
- The typed `$api` comes from the shared `@lukasbriza/api` package (schema lives there). Bind it
  once in `src/lib/api.ts` (baseUrl from `NEXT_PUBLIC_API_BASE_URL`) and import `$api` from `@/lib/api`.

## Common Mistakes

| Mistake | Instead |
|---|---|
| Logic in `src/app/**` route file | re-export from `src/modules`/`src/layout` |
| `next/head` for metadata | Metadata API |
| Re-declaring page/layout prop types | `WebPage` / `AsyncWebLayout` |
| `process.env` in a client component | `env()` from `next-runtime-env` |
| Editing the API schema by hand | regenerate in `@lukasbriza/api` |
| Computed `middleware` matcher | plain string literal |

## State & data — pick the right tool

Don't default to a global store. Match the kind of state to its tool:

| State | Use |
|---|---|
| Server data | Fetch in Server Components; for client fetching use the typed `$api` (from `@/lib/api`, backed by `@lukasbriza/api`) |
| URL state (filters, tabs, pagination) | `searchParams` — shareable, no store |
| Form state | `react-hook-form` (+ `yup`) |
| Local UI state | `useState` / `useReducer` |
| Shared client UI state (drawers, modals, wizards) | Zustand via the SSR-safe provider pattern (`src/stores`) |

### TanStack Query + RSC hydration

Prefetch on the server, hydrate into the client cache — no loading flash, client keeps caching/refetch/mutations:

- `getQueryClient()` (`src/lib/query/query-client.ts`) returns a **fresh client per request on the server**, a **singleton in the browser** — never a module-level singleton (leaks between users).
- Server Component: `await queryClient.prefetchQuery($api.queryOptions('get', '/path', init))`, then wrap the client subtree in `<HydrationBoundary state={dehydrate(queryClient)}>`.
- Client component: `$api.useQuery('get', '/path', init)` — same key, reads from the hydrated cache.
- `QueryProvider` wraps the app once (in `web-layout`).

### Zustand — SSR-safe

Never `const store = createStore(...)` at module scope — on the server it's shared across requests and leaks state between users. Instead:

- A **factory** `createXxxStore()` (`createStore` from `zustand`).
- A Client Component **provider** that creates the store once via lazy `useState(createXxxStore)` (reading a `useRef` during render trips React 19's rules-of-refs).
- A **selector hook** `useXxxStore(selector)` via `useStore` — subscribe to slices, never the whole store.

Reference: `src/stores/ui-store.ts` + `ui-store-provider.tsx`.
