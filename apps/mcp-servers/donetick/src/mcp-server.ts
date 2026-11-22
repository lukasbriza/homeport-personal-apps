/**
 * The MCP part of the server: which tools exist, and the handler that answers MCP requests with them.
 *
 *   tool            file                     what it does              Donetick eAPI call
 *   list_chores     tools/list-chores.ts     list chores, filtered     GET  /eapi/v1/chore
 *   list_members    tools/list-members.ts    list circle members       GET  /eapi/v1/circle/members
 *   create_chore    tools/create-chore.ts    create a chore            POST /eapi/v1/chore
 *   update_chore    tools/update-chore.ts    change fields of a chore  GET  /eapi/v1/chore, PUT /eapi/v1/chore/{id}
 *   complete_chore  tools/complete-chore.ts  mark a chore done         POST /eapi/v1/chore/{id}/complete
 *
 * Each tool file holds what the AI client sees (title, description, hints), the handler and the eAPI call. Input
 * schemas are in validations.ts, code used by several tools in tools/shared/. There is no delete tool on purpose.
 *
 * A new tool is a new file in tools/ plus one line in `createMcpServer`.
 */
import { createMcpHandler, type McpHttpHandler, McpServer } from '@modelcontextprotocol/server'

import { registerCompleteChore } from './tools/complete-chore.js'
import { registerCreateChore } from './tools/create-chore.js'
import { registerListChores } from './tools/list-chores.js'
import { registerListMembers } from './tools/list-members.js'
import { registerUpdateChore } from './tools/update-chore.js'
import type { DonetickClient } from './types.js'
import { logError } from './utils/log.js'

/** One MCP server with all tools. The name and version are what the AI client sees. */
const createMcpServer = (client: DonetickClient): McpServer => {
  const server = new McpServer({ name: 'mcp-donetick-server', version: '0.1.0' })
  registerListChores(server, client)
  registerListMembers(server, client)
  registerCreateChore(server, client)
  registerUpdateChore(server, client)
  registerCompleteChore(server, client)
  return server
}

/**
 * The MCP handler (SDK v2) that POST /mcp (routes/mcp/post.ts) passes every request to.
 *
 * Stateless: it builds a fresh MCP server for every HTTP request, nothing is kept between requests. It serves two
 * protocol generations from the same tools:
 *   - 2026-07-28: no handshake, every request carries its own context (`server/discover` is optional)
 *   - 2025 and older: `initialize` is answered by the SDK's stateless fallback
 */
export const createMcpHttpHandler = (client: DonetickClient): McpHttpHandler =>
  createMcpHandler(() => createMcpServer(client), {
    onerror: (error) => {
      logError({ error: String(error) })
    },
  })
