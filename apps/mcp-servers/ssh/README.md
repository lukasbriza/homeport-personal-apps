# mcp-ssh

MCP server that lets an AI client (e.g. a Claude custom connector) run shell commands on a fixed
list of SSH hosts. It speaks MCP over Streamable HTTP at `/mcp` and is deployed by the
`mcp-servers` chart behind the token gateway at `https://<host>/ssh/mcp`.

## How it works

```
AI client --HTTPS--> gateway (checks X-Auth-Token) --> POST /mcp --> MCP tool --SSH--> host
```

A tool takes a host **alias** (a key of `SSH_HOSTS`), never an address. `ssh_exec` connects, runs one command and
disconnects; `ssh_open` / `ssh_run` / `ssh_close` keep the connection in the session store, which also remembers the
working directory.

## Code layout

A request goes: AI client → gateway (checks the token) → `POST /mcp` → MCP handler → one tool → SSH → host.

| Path                   | What is there                                                                              |
| ---------------------- | ------------------------------------------------------------------------------------------ |
| `src/main.ts`          | Entry point: reads the config, sets up Express, starts listening, shuts down cleanly.      |
| `src/routes/`          | HTTP routes, folder = URL, file = method: `mcp/post.ts` (MCP requests), `mcp/get.ts`.      |
| `src/mcp-server.ts`    | List of tools (with what each does over SSH) and the MCP handler that runs them.           |
| `src/tools/`           | One file per tool: what the AI client sees and the handler.                                |
| `src/tools/shared/`    | Code used by several tools: host lookup (`hosts.ts`), command result (`commands.ts`).      |
| `src/ssh-client.ts`    | Connects to a host (host key check), runs one command. Helpers in `src/utils/ssh.ts`.      |
| `src/session-store.ts` | Keeps connections between calls, remembers `cd` (`src/utils/shell.ts`), closes idle.       |
| `src/config.ts`        | Parses `SSH_HOSTS` at startup.                                                             |
| `src/validations.ts`   | All zod schemas: `SSH_HOSTS`, tool inputs.                                                 |
| `src/types.ts`         | All TypeScript types; the validated ones are inferred from `validations.ts`.               |
| `src/constants.ts`     | Limits, timeouts and defaults.                                                             |
| `src/utils/`           | Helpers: logging, request log, errors, tool answers (`run-tool.ts`), SSH, shell, JSON-RPC. |
| `test/ssh.test.ts`     | End-to-end test with a fake in-process SSH server.                                         |

Where to change what:

- **New tool:** copy a file in `src/tools/`, add its input schema to `src/validations.ts` and one line to
  `createMcpServer` in `src/mcp-server.ts`.
- **What the AI client reads about a tool:** `description` in the tool's file, `.describe()` of its inputs in
  `src/validations.ts`.
- **Limits and timeouts** (output cap, command timeout, session count and idle time): `src/constants.ts`.

### How a session remembers `cd`

Each command runs in a new SSH channel, i.e. a fresh shell that forgets any earlier `cd`. The
session store therefore wraps every command: it first `cd`s into the remembered directory, runs
the command, then prints a random marker line with the exit code and `$PWD`. The store reads the
new directory from that line and removes it from the output. Environment variables do not persist.

## Tools

| Tool                                 | What it does                                                                                                                                       |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ssh_list_hosts`                     | Aliases from `SSH_HOSTS`.                                                                                                                          |
| `ssh_exec`                           | One command, fresh connection, no state.                                                                                                           |
| `ssh_open` / `ssh_run` / `ssh_close` | Session handle (`ssh_...`) that keeps the working directory. Env vars do not persist. 15 min idle TTL, 5 sessions max, in memory (single replica). |

No TTY: `vim`, `top` and password prompts do not work. Output is capped at 64 kB per stream,
timeout 1–200 s (default 30). Every call writes one JSON audit line to stdout.

## Configuration

| Env var             | Required | Meaning                                                                   |
| ------------------- | -------- | ------------------------------------------------------------------------- |
| `SSH_HOSTS`         | yes      | JSON object with the hosts, see below                                     |
| `MCP_ALLOWED_HOSTS` | yes      | Comma-separated hostnames accepted in the `Host` header (public hostname) |
| `MCP_PORT`          | no       | HTTP port, default `9600`                                                 |

### SSH_HOSTS

```json
{
  "web": {
    "host": "192.168.1.10",
    "port": 22,
    "username": "mcp",
    "privateKey": "-----BEGIN OPENSSH PRIVATE KEY-----\n...\n-----END OPENSSH PRIVATE KEY-----\n",
    "hostKeySha256": "SHA256:..."
  }
}
```

- Alias: `[a-z0-9][a-z0-9_-]{0,31}`.
- `hostKeySha256` is mandatory. Get it with `ssh-keyscan -t ed25519 <host> | ssh-keygen -lf -`.
- One dedicated key per host, a user with minimal rights, never root.

## Security

- Only the gateway can reach this server (the chart's NetworkPolicy); the gateway checks the token.
- Every connection verifies the host key against `hostKeySha256`; there is no "trust on first use".
- The `Host` header must be in `MCP_ALLOWED_HOSTS`.
- Invalid `SSH_HOSTS` errors name only the field paths, never values, so private keys stay out of logs.

## Develop

```
pnpm install --ignore-workspace
pnpm ts      # typecheck src and test
pnpm test    # in-process ssh2 server + real MCP client, no docker or sshd needed
pnpm dev     # needs SSH_HOSTS, MCP_ALLOWED_HOSTS, optional MCP_PORT
```

Release: push tag `mcp-ssh-v<version>`.
