/**
 * The MCP part of the server: which tools exist, and the handler that answers MCP requests with them.
 *
 *   tool            file                 what it does                       SSH
 *   ssh_list_hosts  tools/list-hosts.ts  list the configured host aliases   none, reads SSH_HOSTS
 *   ssh_exec        tools/exec.ts        run one command                    connect, run, disconnect
 *   ssh_open        tools/open.ts        open a session                     connect, keep the connection
 *   ssh_run         tools/run.ts         run a command in a session         run on the kept connection
 *   ssh_close       tools/close.ts       close a session                    disconnect
 *
 * Each tool file holds what the AI client sees (title, description, hints) and the handler. Input schemas are in
 * validations.ts, code used by several tools in tools/shared/. The SSH work itself is in ssh-client.ts (one
 * connection, one command) and session-store.ts (connections kept between calls).
 *
 * A new tool is a new file in tools/ plus one line in `createMcpServer`.
 */
import { createMcpHandler, type McpHttpHandler, McpServer } from '@modelcontextprotocol/server'

import { registerClose } from './tools/close.js'
import { registerExec } from './tools/exec.js'
import { registerListHosts } from './tools/list-hosts.js'
import { registerOpen } from './tools/open.js'
import { registerRun } from './tools/run.js'
import type { ToolContext } from './types.js'
import { logError } from './utils/log.js'

/** One MCP server with all tools. The name and version are what the AI client sees. */
const createMcpServer = (context: ToolContext): McpServer => {
  const server = new McpServer({ name: 'mcp-ssh-server', version: '0.2.1' })
  registerListHosts(server, context)
  registerExec(server, context)
  registerOpen(server, context)
  registerRun(server, context)
  registerClose(server, context)
  return server
}

/**
 * The MCP handler (SDK v2) that POST /mcp (routes/mcp/post.ts) passes every request to.
 *
 * Stateless: it builds a fresh MCP server for every HTTP request. Nothing is kept between requests except the SSH
 * sessions, which live in the shared session store. It serves two protocol generations from the same tools:
 *   - 2026-07-28: no handshake, every request carries its own context (`server/discover` is optional)
 *   - 2025 and older: `initialize` is answered by the SDK's stateless fallback
 */
export const createMcpHttpHandler = (context: ToolContext): McpHttpHandler =>
  createMcpHandler(() => createMcpServer(context), {
    onerror: (error) => {
      logError({ error: String(error) })
    },
  })
