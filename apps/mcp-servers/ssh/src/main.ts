/**
 * Entry point of the SSH MCP server.
 *
 * Request flow:
 *   AI client -> gateway (checks the token, see the mcp-servers chart) -> POST /mcp (routes/)
 *   -> MCP tools (mcp-server.ts) -> SSH (ssh-client.ts, session-store.ts) -> host
 *
 * Configuration (env vars):
 *   SSH_HOSTS          JSON list of hosts, see config.ts
 *   MCP_ALLOWED_HOSTS  comma-separated hostnames accepted in the Host header (the public hostname)
 *   MCP_PORT           HTTP port, default 9600
 */
import { hostHeaderValidation } from '@modelcontextprotocol/sdk/server/middleware/hostHeaderValidation.js'
import express from 'express'

import { parseHosts } from './config.js'
import { registerRoutes } from './routes/index.js'
import { createSessionStore } from './session-store.js'
import { logInfo } from './utils/log.js'

// ---- 1. Configuration: fail at startup when something is missing ----

const hosts = parseHosts(process.env.SSH_HOSTS)
const port = Number(process.env.MCP_PORT ?? 9600)
const allowedHosts = (process.env.MCP_ALLOWED_HOSTS ?? '')
  .split(',')
  .map((host) => host.trim())
  .filter(Boolean)
if (allowedHosts.length === 0) throw new Error('MCP_ALLOWED_HOSTS is not set')

// ---- 2. HTTP app ----

// Shared by all requests, so sessions survive between tool calls.
const sessions = createSessionStore()

const app = express()
app.disable('x-powered-by')
// Rejects requests whose Host header is not in MCP_ALLOWED_HOSTS (protects against DNS rebinding).
app.use(hostHeaderValidation(allowedHosts))
app.use(express.json({ limit: '1mb' }))

// Every route is a file in routes/ (folder = URL, file = HTTP method); see routes/index.ts.
registerRoutes(app, { hosts, sessions })

// ---- 3. Start and shutdown ----

// Express 5 passes listen errors (e.g. port already in use) to this callback instead of throwing.
const httpServer = app.listen(port, '0.0.0.0', (error?: Error) => {
  if (error) throw error
  logInfo({ msg: 'listening', port, hosts: Object.keys(hosts) })
})

// Kubernetes sends SIGTERM before stopping the pod: close SSH sessions, finish open requests, exit.
for (const signal of ['SIGTERM', 'SIGINT'] as const) {
  process.on(signal, () => {
    sessions.closeAll()
    httpServer.close(() => process.exit(0))
  })
}
