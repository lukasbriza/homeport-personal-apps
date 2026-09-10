# CLAUDE.md — api package (@lukasbriza/api)

Shared, typed API surface. Inherits root `CLAUDE.md`.

## Stack

- `openapi-fetch` + `openapi-react-query` over an OpenAPI schema. Built as a library (`dist/`).
- Peer deps: `@tanstack/react-query` + `react` (apps provide them — never bundle a second copy).

## Surface (`src/index.ts`)

- `createApiClient<Paths>(baseUrl)` — generic engine; builds `{ fetchClient, $api }` for **any**
  OpenAPI schema. This is what makes the package multi-schema.
- `createApi(baseUrl)` — the primary API, built on the engine (schema `./schema.ts`).
  `$api.useQuery('get', '/path', …)` and `$api.queryOptions(...)` are fully typed.
- `type Api`, `type paths` (the primary schema types).

## How apps use it

Each app owns only the baseUrl (env is platform-specific), then binds the client once:

```ts
// app: lib/api.ts
import { createApi } from '@lukasbriza/api'
import { env } from './env'

export const { $api, fetchClient } = createApi(env.apiBaseUrl)
```

Components import `$api` from the app's `lib/api`, not from this package directly — that keeps a
single client instance per app.

## Multiple APIs (multi-schema)

`baseUrl` is always a per-app / per-call argument, so **one** factory already covers dev/staging/prod
or per-tenant hosts of the _same_ API. Add a new factory only when an app talks to a genuinely
_different_ API (different schema). The shared `createApiClient` engine makes it a two-step add:

1. Drop the spec at `src/schema.billing.json`, add its generate line (below), run it → `schema.billing.ts`.
2. Pair it with a named factory in `client.ts`:

   ```ts
   import type { paths as billingPaths } from './schema.billing'
   export const createBillingApi = (baseUrl: string) => createApiClient<billingPaths>(baseUrl)
   ```

   Re-export its paths from `index.ts` namespaced: `export type { paths as BillingPaths } from './schema.billing'`.

Split into separate packages (`@lukasbriza/api-billing`) only when domains are truly independent
(separate ownership/release cadence); otherwise co-locating schemas here is simpler.

## Schema

- `src/schema.json` is the OpenAPI source; `src/schema.ts` is generated — **never hand-edit it**.
  Additional APIs use `src/schema.<name>.{json,ts}`.
- Regenerate with `pnpm api-schema:generate`; add one `openapi-typescript` line per schema, chained
  with `&&` so the script stays cross-platform.

## Don't touch

- Generated: `dist/`, `src/schema.ts`. Edit conventions in `templates/package-api`.
