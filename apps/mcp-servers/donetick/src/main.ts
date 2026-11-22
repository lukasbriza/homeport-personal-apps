/**
 * Entry point of the Donetick MCP server: reads the config, sets up Express, starts listening.
 *
 * Request flow (files in brackets):
 *   AI client -> gateway (checks the token, see the mcp-servers chart)
 *   -> POST /mcp (routes/mcp/post.ts) -> MCP handler (mcp-server.ts) -> one tool (tools/<tool>.ts)
 *   -> Donetick eAPI (donetick-client.ts)
 *
 * The code map is in README.md ("Code layout").
 *
 * Configuration (env vars):
 *   DONETICK_BASE_URL, DONETICK_TOKEN, DONETICK_HOST_HEADER   the Donetick instance, see config.ts
 *   MCP_ALLOWED_HOSTS  comma-separated hostnames accepted in the Host header (the public hostname)
 *   MCP_PORT           HTTP port, default 9601
 */
import { hostHeaderValidation } from '@modelcontextprotocol/express'
import express from 'express'

import { parseConfig } from './config.js'
import { DEFAULT_PORT, JSON_BODY_LIMIT } from './constants.js'
import { createDonetickClient } from './donetick-client.js'
import { createMcpHttpHandler } from './mcp-server.js'
import { registerRoutes } from './routes/index.js'
import { logInfo } from './utils/log.js'
import { logRequests } from './utils/request-log.js'

// ---- 1. Configuration: fail at startup when something is missing ----

const config = parseConfig(process.env)
const port = Number(process.env.MCP_PORT ?? DEFAULT_PORT)
const allowedHosts = (process.env.MCP_ALLOWED_HOSTS ?? '')
  .split(',')
  .map((host) => host.trim())
  .filter(Boolean)
if (allowedHosts.length === 0) throw new Error('MCP_ALLOWED_HOSTS is not set')

// ---- 2. HTTP app ----

const client = createDonetickClient(config)

const app = express()
app.disable('x-powered-by')
// First, so rejected requests (e.g. a wrong Host header) are logged too.
app.use(logRequests)
// Rejects requests whose Host header is not in MCP_ALLOWED_HOSTS (protects against DNS rebinding).
app.use(hostHeaderValidation(allowedHosts))
app.use(express.json({ limit: JSON_BODY_LIMIT }))

// The MCP handler answers MCP requests with the tools (mcp-server.ts); the routes hand requests to it.
const mcpHandler = createMcpHttpHandler(client)
// Every route is a file in routes/ (folder = URL, file = HTTP method); see routes/index.ts.
registerRoutes(app, { mcpHandler })

// ---- 3. Start and shutdown ----

// Express 5 passes listen errors (e.g. port already in use) to this callback instead of throwing.
const httpServer = app.listen(port, '0.0.0.0', (error?: Error) => {
  if (error) throw error
  logInfo({ msg: 'listening', port, donetick: config.baseUrl })
})

// Kubernetes sends SIGTERM before stopping the pod: finish open requests, exit.
for (const signal of ['SIGTERM', 'SIGINT'] as const) {
  process.on(signal, () => {
    void mcpHandler.close()
    httpServer.close(() => process.exit(0))
  })
}
