# mcp-donetick

MCP server that lets an AI client (e.g. a Claude custom connector) work with the chores in a
[Donetick](https://github.com/donetick/donetick) instance. It speaks MCP over Streamable HTTP at `/mcp` and is
deployed by the `mcp-servers` chart behind the token gateway at `https://<host>/donetick/mcp`.

It talks to Donetick with an API token, not with a user name and password, and exposes only the tools below. There
is no tool that deletes a chore.

## Tools

| Tool               | What it does                                                                                       |
| ------------------ | -------------------------------------------------------------------------------------------------- |
| `list_chores`      | Chores, earliest due date first. Filters: `status`, `label`, `search`, `due_before`, `limit`.      |
| `list_members`     | Circle members; their `userId` is the `assigned_to` of the write tools.                            |
| `create_chore`     | New chore: name, description, schedule, due date, priority, points, assignee, label ids, subtasks. |
| `update_chore`     | Changes the given fields; the rest stays. `is_active: false` archives.                             |
| `complete_chore`   | Marks a chore done, optionally with a note.                                                        |
| `update_subtasks`  | Adds (also nested), renames and deletes subtasks in one call.                                      |
| `complete_subtask` | Checks a subtask off (`done: true`) or unchecks it (`done: false`).                                |

Answers are short JSON summaries of the chores (no sync fields, descriptions without HTML and cut to 300 characters).
Labels come as `labels: [{ id, name }]`, subtasks as `subtasks: [{ id, name, done, parentId? }]`.

## Code layout

A request goes: AI client → gateway (checks the token) → `POST /mcp` → MCP handler → one tool → Donetick API.

| Path                         | What is there                                                                         |
| ---------------------------- | ------------------------------------------------------------------------------------- |
| `src/main.ts`                | Entry point: reads the config, sets up Express, starts listening, shuts down cleanly. |
| `src/routes/`                | HTTP routes, folder = URL, file = method: `mcp/post.ts` (MCP requests), `mcp/get.ts`. |
| `src/mcp-server.ts`          | List of tools (with the Donetick call each makes) and the MCP handler that runs them. |
| `src/tools/`                 | One file per tool: what the AI client sees, the handler and the Donetick call.        |
| `src/tools/shared/chores.ts` | Chore code used by several tools: fetch, whole-chore save, summary, request fields.   |
| `src/donetick-client.ts`     | Donetick client: one call with retry. Sending and parsing in `src/utils/http.ts`.     |
| `src/config.ts`              | Env vars → config, checked at startup.                                                |
| `src/validations.ts`         | All zod schemas: config, eAPI answers, tool inputs.                                   |
| `src/types.ts`               | All TypeScript types; the validated ones are inferred from `validations.ts`.          |
| `src/constants.ts`           | Limits, timeouts and defaults.                                                        |
| `src/utils/`                 | Helpers: logging, request log, errors, tool answers (`run-tool.ts`), HTTP, JSON-RPC.  |
| `test/donetick.test.ts`      | End-to-end test: fake eAPI + the real server + a real MCP client.                     |

Where to change what:

- **New tool:** copy a file in `src/tools/`, add its input schema to `src/validations.ts` and one line to
  `createMcpServer` in `src/mcp-server.ts`.
- **What the AI client reads about a tool:** `description` in the tool's file, `.describe()` of its inputs in
  `src/validations.ts`.
- **A request body Donetick rejects:** `toChoreChanges` in `src/tools/shared/chores.ts`.
- **Limits and timeouts:** `src/constants.ts`.

## Donetick API, as far as it is known

There is no public reference. The facts below come from Donetick's source (`internal/chore/api.go`, `handler.go`,
`internal/auth/multiauthmiddleware.go`) and from probing a running instance.

- Two APIs take the same token in the header `secretkey`: the **eAPI** (`/eapi/v1`) and the **main API** (`/api/v1`,
  which the web app uses). Without the header the answer is `401 {"error":"API token required"}`.
- Every unknown path answers with the web app's `index.html` and status 200. The client turns that into an error.
- eAPI, used for reads and `complete_chore`:
  - `GET /eapi/v1/chore` is the list; subtasks only with `?includeSubtasks=true`.
  - `POST /eapi/v1/chore/{id}/complete`, `GET /eapi/v1/circle/members`.
  - Its create and update **write only name, description and due date**; priority, points, labels, assignee and
    subtasks would be silently dropped. So this server does not use them.
- Main API, used for all other writes:
  - `GET /api/v1/chores/{id}` is one chore with every field, wrapped as `{ "res": chore }`.
  - `POST /api/v1/chores/` creates a chore (subtasks included) and answers only `{ "res": <new id> }`.
  - `PUT /api/v1/chores/` (the id is in the body) **replaces the whole chore and clears every field left out**. So an
    edit always reads the chore first and sends it all back with the changes applied (`saveFullChore`). It also
    sends `updatedAt` back, so Donetick refuses the edit (403) when someone changed the chore in between. Labels go
    as `[{ id }]` and must always be present: Donetick fails on a missing list.
  - The edit cannot keep a link to a Donetick "thing", so a linked chore is refused instead of losing the link.
  - Subtasks in the edit are compared with the stored ones: a missing id is deleted, id 0 is new, a changed name or
    order is updated. Their done state is not written there.
  - `PUT /api/v1/chores/{id}/subtask` with `{ id, choreId, completedAt }` checks one off (`null` unchecks). It
    answers `200 {}` even for an unknown id, so the tool looks the subtask up first.
- **Not verified against a live instance yet.** Check once on a throwaway chore after deploy: create it with
  subtasks, update a field and the labels, add/rename/remove a subtask, check one off, then archive the chore. If
  Donetick rejects a body, the tool returns its error text; the request fields are built in
  `src/tools/shared/chores.ts`.

## KEDA

In the cluster Donetick is scaled to zero. `DONETICK_BASE_URL` points at the KEDA interceptor service. While Donetick
sleeps, the interceptor answers at once with `503` and a small HTML "starting" page, starts the pod and forwards
nothing. The client therefore repeats any request (POST and PUT too: nothing reached Donetick) every 3 s, at most 20
times (about a minute; the pod needs ~15 s), and then answers "Donetick is still starting up". The limits are
`RETRY_DELAY_MS` and `MAX_WAKE_UP_ATTEMPTS` in `src/constants.ts`.

The interceptor routes by the `Host` header, which `fetch` cannot override, so the client uses `node:http`.

## Configuration (env vars)

| Variable               | Meaning                                                                               |
| ---------------------- | ------------------------------------------------------------------------------------- |
| `DONETICK_BASE_URL`    | Origin of Donetick or of the KEDA interceptor, e.g. `http://127.0.0.1:2021`. No path. |
| `DONETICK_TOKEN`       | Donetick API token. Never logged and never part of an error message.                  |
| `DONETICK_HOST_HEADER` | Optional `Host` header, needed behind the KEDA interceptor.                           |
| `MCP_ALLOWED_HOSTS`    | Comma-separated hostnames accepted in the `Host` header (the public hostname).        |
| `MCP_PORT`             | HTTP port, default `9601`.                                                            |

## Develop and test

```sh
pnpm install --ignore-workspace
pnpm ts       # type check
pnpm test     # end-to-end: fake Donetick eAPI + the real server + a real MCP client, no Donetick needed
pnpm dev      # run the server (needs the env vars above)
```

## Deploy

1. Infisical, folder `/mcp-servers/donetick`: `MCP_DONETICK_GATEWAY_TOKEN` (`openssl rand -hex 32`) and
   `MCP_DONETICK_API_TOKEN` (the Donetick API token).
2. Tag `mcp-donetick-vX.Y.Z` (a new tag every time, never a reused one). The workflow tests, builds the image, bumps the
   tag in `k8s/chart/servers/donetick.yaml` and syncs ArgoCD.
3. Set `enabled: true` in `servers/donetick.yaml`, then a `mcp-servers-v*` tag. The gateway restarts
   (`kubectl -n mcp-servers rollout restart deploy/mcp-gateway`) when its config changes.
4. Claude connector: URL `https://<host>/donetick/mcp`, Authentication "No sign-in", request header `x-auth-token` with
   the gateway token.
