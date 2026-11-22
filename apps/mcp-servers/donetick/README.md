# mcp-donetick

MCP server that lets an AI client (e.g. a Claude custom connector) work with the chores in a
[Donetick](https://github.com/donetick/donetick) instance. It speaks MCP over Streamable HTTP at `/mcp` and is
deployed by the `mcp-servers` chart behind the token gateway at `https://<host>/donetick/mcp`.

It talks to Donetick's **external API (eAPI)** with an API token, not with a user name and password, and exposes
only the tools below. There is no delete tool.

## Tools

| Tool             | What it does                                                                                   |
| ---------------- | ---------------------------------------------------------------------------------------------- |
| `list_chores`    | Chores, earliest due date first. Filters: `status`, `label`, `search`, `due_before`, `limit`.  |
| `list_members`   | Circle members; their `userId` is the `assigned_to` of the write tools.                        |
| `create_chore`   | New chore (name, optional description, due date, priority, points, assignee, label ids).       |
| `update_chore`   | Changes given fields; sends the whole chore back with the changes applied (the eAPI replaces). |
| `complete_chore` | Marks a chore done, optionally with a note.                                                    |

Answers are short JSON summaries of the chores (no sync fields, descriptions without HTML and cut to 300 characters).

## Code layout

A request goes: AI client → gateway (checks the token) → `POST /mcp` → MCP handler → one tool → Donetick eAPI.

| Path                         | What is there                                                                          |
| ---------------------------- | -------------------------------------------------------------------------------------- |
| `src/main.ts`                | Entry point: reads the config, sets up Express, starts listening, shuts down cleanly.  |
| `src/routes/`                | HTTP routes, folder = URL, file = method: `mcp/post.ts` (MCP requests), `mcp/get.ts`.  |
| `src/mcp-server.ts`          | List of tools (with the eAPI call each makes) and the MCP handler that runs them.      |
| `src/tools/`                 | One file per tool: what the AI client sees, the handler and the Donetick call.         |
| `src/tools/shared/chores.ts` | Chore code used by several tools: fetch, summary, request body of create and update.   |
| `src/donetick-client.ts`     | Donetick eAPI client: one call with retry. Sending and parsing in `src/utils/http.ts`. |
| `src/config.ts`              | Env vars → config, checked at startup.                                                 |
| `src/validations.ts`         | All zod schemas: config, eAPI answers, tool inputs.                                    |
| `src/types.ts`               | All TypeScript types; the validated ones are inferred from `validations.ts`.           |
| `src/constants.ts`           | Limits, timeouts and defaults.                                                         |
| `src/utils/`                 | Helpers: logging, request log, errors, tool answers (`run-tool.ts`), HTTP, JSON-RPC.   |
| `test/donetick.test.ts`      | End-to-end test: fake eAPI + the real server + a real MCP client.                      |

Where to change what:

- **New tool:** copy a file in `src/tools/`, add its input schema to `src/validations.ts` and one line to
  `createMcpServer` in `src/mcp-server.ts`.
- **What the AI client reads about a tool:** `description` in the tool's file, `.describe()` of its inputs in
  `src/validations.ts`.
- **A request body Donetick rejects:** `toChoreChanges` in `src/tools/shared/chores.ts`.
- **Limits and timeouts:** `src/constants.ts`.

## Donetick eAPI, as far as it is known

Found by probing a running instance, there is no public reference:

- Auth: header `secretkey: <API token>`. Without it the answer is `401 {"error":"API token required"}`.
- Routes used: `GET /eapi/v1/chore`, `POST /eapi/v1/chore`, `PUT /eapi/v1/chore/{id}`,
  `POST /eapi/v1/chore/{id}/complete`, `GET /eapi/v1/circle/members`. `DELETE /eapi/v1/chore/{id}` exists, unused.
- Every unknown path answers with the web app's `index.html` and status 200. The client turns that into an error.
- **The request bodies of create, update and complete are modelled on the objects `GET` returns and are not verified.**
  Check them once on a throwaway chore after the first deploy (create, update, complete, then archive it in Donetick).
  If Donetick rejects a body, the tool returns its error text; adjust `toChoreChanges` in `src/tools/shared/chores.ts`.

## KEDA

In the cluster Donetick is scaled to zero. `DONETICK_BASE_URL` points at the KEDA interceptor service, which starts
the pod and holds the request until it is ready (the first call can take up to a minute; the client waits 60 s).
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
