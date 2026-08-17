# CLAUDE.md — Next.js app

Per-app context. Inherits monorepo conventions from the root `CLAUDE.md`; this file
covers only what is specific to a Next.js app.

## Stack

- Next.js 16, **App Router** (Turbopack default), React 19, TypeScript.
- i18n: `next-international` (`src/i18n`), locale segment `src/app/[locale]`.
- Styling: MUI + `@emotion` with an SSR registry (`src/layout/registry`).
- Forms: `react-hook-form` + `yup` (`@hookform/resolvers`).
- API: shared **`@lukasbriza/api`** (`$api`), bound to the baseUrl once in `src/lib/api.ts`.
- Data/state: **TanStack Query** with RSC hydration (`src/lib/query`) for server data;
  **Zustand** (SSR-safe provider, `src/stores`) for shared client UI state.
- Public env: `NEXT_PUBLIC_*` vars, read via `process.env` (inlined at build time).

## Project structure — where things go

`src/app/` is **only a routing map**: every route file is a thin re-export of the real
implementation in a module. No logic lives in `app/`.

| Path | Holds |
|---|---|
| `src/app/[locale]/**` | route files (`page.ts`, `layout.ts`, `error.ts`, `not-found.ts`) — **re-export only** |
| `src/modules/<feature>/` | the feature's real code: `page.tsx`, `error.tsx`, `not-found.tsx`, `components/`, `hooks/`, `index.ts` |
| `src/components/` | components shared across features (add when the first shared one appears) |
| `src/hooks/` | hooks shared across features |
| `src/layout/` | root/web layouts + emotion SSR `registry/`; wraps the app in `QueryProvider` + `UiStoreProvider` |
| `src/lib/` | `api.ts` (binds `@lukasbriza/api` → `$api`), `query/` (TanStack Query client + provider) |
| `src/stores/` | Zustand stores (SSR-safe factory + provider + selector hook) |
| `src/i18n/` | `next-international` config, `client`, `server`, `locales/` |
| `src/shared/` | shared types |

Rules:

- A route file re-exports from its module: `app/[locale]/(web)/page.ts` →
  `@/modules/home/page`, `error.ts` → `@/modules/home/error`, etc.
- Feature-local components/hooks live in `modules/<feature>/components` and `/hooks`. Promote to
  `src/components` / `src/hooks` only when a **second** feature needs them.
- A module's `index.ts` is its public API for *other modules*; route files import route entries
  (`page`/`error`/`not-found`) directly, not through the barrel.
- Route groups like `(web)` group routes and their boundary UI without affecting the URL.
- **Route segment config** (`dynamic`, `revalidate`, `fetchCache`, `runtime`, …) is the one thing
  that must be a **literal export in the route file** — Next 16 / Turbopack can't parse it through
  a re-export. Everything else (`default`, `generateMetadata`, `generateStaticParams`) re-exports.
- The `error` route file must carry `'use client'` (it is a client error boundary) even though it
  only re-exports — Next requires the route file itself to be a Client Component.
- Path alias `@/*` → `src/*` (see `tsconfig.json`).
- **Async request APIs (Next 15+/16):** `params`, `searchParams`, `cookies()`, `headers()` are
  Promises — always `await` them. The shared `WebPageProps`/`AsyncWebLayout` types encode this.

## i18n

- Locales and default in `src/i18n/config.ts` (`cs`, `en`; default `en`,
  `prefixDefault: true`). Locale routing runs in `src/proxy.ts` (Next 16's `proxy` convention,
  formerly `middleware`; nodejs runtime, no edge).
- Add a locale: extend `Locale` + `i18nConfig.locales` and add `src/i18n/locales/<x>.ts`.
- Translation dictionaries are typed from the locale files — keep keys in sync.

## Styling (MUI + emotion SSR)

- Do **not** bypass the emotion registry; client components that need emotion must
  render under the registry provided in `src/layout`.
- When consuming a monorepo theme/component package, add it to
  `next.config.mjs` → `transpilePackages` (dev list) so it transpiles correctly.

## API client

- The typed `$api` comes from the shared **`@lukasbriza/api`** package (schema lives there).
  `src/lib/api.ts` binds it to the baseUrl (`NEXT_PUBLIC_API_BASE_URL`); import `$api` from `@/lib/api`.
- `$api` gives typed TanStack Query hooks. Prefer **RSC prefetch +
  `HydrationBoundary`** (reference: `modules/home/page.tsx`) so data ships in the initial HTML.
  State-management decision tree + SSR-safe Zustand pattern live in the `coding-conventions`
  skill (`references/nextjs.md`).

## Env

- Copy `.env.example` → `.env.local` and fill values. `.env.local` is gitignored and
  must never be committed.

## Don't touch

- Generated: `.next/`, `next-env.d.ts`. API schema types live in `@lukasbriza/api`.
- This file ships from `templates/app-next/CLAUDE.md`; edit conventions there, not in
  scaffolded copies, so changes propagate via `turbo gen` / `sync-template`.
