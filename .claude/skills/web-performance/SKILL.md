---
name: web-performance
description: React and Next.js performance guidelines for this monorepo. Apply when writing, reviewing, or refactoring React components, Next routes / Server Components, data fetching, bundle size, or anything performance-sensitive (waterfalls, re-renders, server-side cost). Complements the `coding-conventions` skill (architecture) and eslint (mechanical rules).
---

# React & Next.js performance

Performance-focused rules grouped by impact. This is the **performance axis**; architecture
and conventions live in the `coding-conventions` skill (references/react.md, references/nextjs.md). When a task touches one of these
areas, read the specific `rules/<name>.md` for the why + before/after.

## Rules

### Eliminating waterfalls — CRITICAL
- `async-parallel` — run independent async operations in parallel with `Promise.all`.
- `async-cheap-condition-before-await` — check cheap sync guards before awaiting flags/remote values.
- `async-defer-await` — move `await` into the branch that needs it (pairs with early returns).
- `async-dependencies` — start dependent promises early, await together (partial-dependency graphs).
- `async-suspense-boundaries` — stream slow subtrees with `<Suspense>` instead of blocking the layout.

### Bundle size — CRITICAL
- `bundle-barrel-imports` — don't import large libs through their barrel; use `optimizePackageImports`.
- `bundle-analyzable-paths` — keep import/file paths literal so tools don't over-include.
- `bundle-dynamic-imports` — lazy-load heavy client-only components with `next/dynamic`.
- `bundle-defer-third-party` — load analytics/logging after hydration (dynamic `ssr: false`).
- `bundle-conditional` — dynamic-import heavy modules/data only when a feature is enabled.
- `bundle-preload` — warm up a lazy bundle on hover/focus.

### Server-side — HIGH
- `server-auth-actions` — authenticate + authorize inside every server action; validate first.
- `server-cache-react` — dedupe request-scoped DB/auth work with React `cache()`.
- `server-dedup-props` — pass raw data once across the RSC boundary; derive in the client.
- `server-hoist-static-io` — read request-invariant assets (fonts/config) at module level, once.
- `server-no-shared-module-state` — never put request/user data in module-level state on the server.
- `server-serialization` — pass only the fields the client uses across the RSC boundary.
- `server-parallel-fetching` — co-locate each RSC fetch in its own async component so siblings run in parallel.
- `server-parallel-nested-fetching` — chain each item's dependent fetch so a slow one doesn't block others.
- `server-after-nonblocking` — run logging/analytics side effects in Next `after()`, not before the response.

### Client-side data fetching — MEDIUM-HIGH
- `client-fetch-on-server` — prefer server fetching over `useEffect` fetches; add a data lib deliberately if needed.
- `client-event-listeners` — share one global window listener across hook instances via a module registry.
- `client-passive-event-listeners` — mark touch/wheel listeners `{ passive: true }` when they don't preventDefault.
- `client-localstorage-schema` — version + minimize localStorage, always wrap access in try/catch.

### Re-render optimization — MEDIUM
- `rerender-defer-reads` — don't subscribe to state (searchParams/store) you only read in callbacks.
- `rerender-derived-state-no-effect` — derive values during render; don't mirror in state via effects.
- `rerender-no-inline-components` — define components at module scope; passing props, not nesting (avoids remounts).
- `rerender-lazy-state-init` — pass a function to `useState` for expensive initial values.
- `rerender-functional-setstate` — use `setX(curr => …)` when next state depends on current.
- `rerender-move-effect-to-event` — run user-action side effects in the handler, not a state+effect.
- `rerender-transitions` — wrap frequent non-urgent updates in `startTransition`.

### Rendering — MEDIUM
- `rendering-conditional-render` — use `cond ? … : null` (not `cond && …`) so `0`/`NaN` don't render.
