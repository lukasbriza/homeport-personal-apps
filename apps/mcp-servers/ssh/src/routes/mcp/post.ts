/**
 * POST /mcp: one MCP request (initialize, list tools, call a tool, ...).
 *
 * Stateless MCP: every request gets a fresh MCP server and transport. Nothing is kept between
 * requests except the SSH sessions, which live in the shared session store.
 */
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import type { Request, Response } from 'express'

import { createMcpServer } from '../../mcp-server.js'
import { sendInternalError } from '../../utils/json-rpc-errors.js'
import { logError } from '../../utils/log.js'
import type { RouteContext } from '../index.js'

export const createPostMcpHandler =
  ({ hosts, sessions }: RouteContext) =>
  async (req: Request, res: Response) => {
    const server = createMcpServer(hosts, sessions)
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined })
    res.on('close', () => {
      void transport.close()
      void server.close()
    })

    try {
      await server.connect(transport)
      await transport.handleRequest(req, res, req.body)
    } catch (error) {
      logError({ error: String(error) })
      if (res.headersSent) return
      sendInternalError(res)
    }
  }
