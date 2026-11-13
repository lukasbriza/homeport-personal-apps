/**
 * POST /mcp: one MCP request (discover, list tools, call a tool, ...).
 *
 * The SDK handler does the protocol work; this adapts Express to it. `req.body` is already parsed
 * by express.json(), so it is passed along instead of letting the handler read the stream again.
 */
import { toNodeHandler } from '@modelcontextprotocol/node'
import type { McpHttpHandler } from '@modelcontextprotocol/server'
import type { Request, Response } from 'express'

import { sendInternalError } from '../../utils/json-rpc-errors.js'
import { logError } from '../../utils/log.js'

export const createPostMcpHandler = (mcpHandler: McpHttpHandler) => {
  const handle = toNodeHandler(mcpHandler, {
    onerror: (error) => {
      logError({ error: String(error) })
    },
  })
  return async (req: Request, res: Response) => {
    try {
      await handle(req, res, req.body)
    } catch (error) {
      logError({ error: String(error) })
      if (!res.headersSent) sendInternalError(res)
    }
  }
}
