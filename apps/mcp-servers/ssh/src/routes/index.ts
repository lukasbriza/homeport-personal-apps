/**
 * All HTTP routes in one place. The folder structure mirrors the URLs: routes/<path>/<method>.ts.
 *
 *   POST  /mcp   routes/mcp/post.ts   MCP requests (initialize, list tools, call a tool)
 *   GET   /mcp   routes/mcp/get.ts    405: tells MCP clients this server has no server-to-client stream
 *
 * A new route is a new file plus one line in `registerRoutes`.
 */
import type { Express } from 'express'

import type { Hosts } from '../config.js'
import type { SessionStore } from '../session-store.js'

import { handleGetMcp } from './mcp/get.js'
import { createPostMcpHandler } from './mcp/post.js'

/** What route handlers need from the rest of the app. */
export type RouteContext = {
  hosts: Hosts
  sessions: SessionStore
}

export const registerRoutes = (app: Express, context: RouteContext) => {
  app.post('/mcp', createPostMcpHandler(context))
  app.get('/mcp', handleGetMcp)
}
