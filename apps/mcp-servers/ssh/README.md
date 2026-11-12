# mcp-ssh

MCP server that lets an AI client (e.g. a Claude custom connector) run shell commands on a fixed
list of SSH hosts. It speaks MCP over Streamable HTTP at `/mcp` and is deployed by the
`mcp-servers` chart behind the token gateway at `https://<host>/ssh/mcp`.

## How it works

```
AI client --HTTPS--> gateway (checks X-Auth-Token) --> POST /mcp --> MCP tool --SSH--> host
```

1. `main.ts` reads the config, starts an Express app and registers the routes from `routes/`.
2. `routes/mcp/post.ts` handles `POST /mcp`: every request gets a fresh MCP server (stateless MCP).
3. `mcp-server.ts` defines the tools. A tool takes a host **alias** and looks it up in `SSH_HOSTS`.
4. `ssh_exec` connects, runs one command and disconnects (`ssh-client.ts`).
5. `ssh_open` / `ssh_run` / `ssh_close` keep the connection in the session store
   (`session-store.ts`), which also remembers the working directory.

| File                   | What it does                                                                        |
| ---------------------- | ----------------------------------------------------------------------------------- |
| `src/main.ts`          | Entry point: env config, Express app, startup and shutdown                          |
| `src/routes/`          | HTTP routes, one file per route: folder = URL, file = method (`routes/mcp/post.ts`) |
| `src/utils/`           | General helpers: JSON logging, JSON-RPC error responses, MCP tool results           |
| `src/config.ts`        | Parses and validates `SSH_HOSTS`                                                    |
| `src/mcp-server.ts`    | Tool definitions, output formatting, audit log                                      |
| `src/ssh-client.ts`    | Connects to a host (with host key check), runs one command with a timeout and a cap |
| `src/session-store.ts` | Keeps connections open between calls, remembers `cd`, closes idle sessions          |
| `test/ssh.test.ts`     | End-to-end test with a fake in-process SSH server                                   |

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
timeout 1–300 s (default 30). Every call writes one JSON audit line to stdout.

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
