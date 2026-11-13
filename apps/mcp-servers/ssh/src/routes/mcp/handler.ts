/**
 * The MCP HTTP handler (SDK v2), shared by all requests.
 *
 * Serves two protocol generations from the same tools:
 *   - 2026-07-28: no handshake, every request carries its own context (`server/discover` is optional).
 *   - 2025 and older clients: `initialize` is answered by the SDK's stateless fallback.
 * Both are stateless: the factory builds a fresh MCP server for every HTTP request. Nothing is kept
 * between requests except the SSH sessions, which live in the shared session store.
 */
import { createMcpHandler, type McpHttpHandler, type McpServer } from '@modelcontextprotocol/server'

import { logError } from '../../utils/log.js'

export const createMcpHttpHandler = (createServer: () => McpServer): McpHttpHandler =>
  createMcpHandler(() => createServer(), {
    onerror: (error) => {
      logError({ error: String(error) })
    },
  })
