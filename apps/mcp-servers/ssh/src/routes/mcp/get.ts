/**
 * GET /mcp: answers 405, on purpose.
 *
 * After `initialize`, an MCP client sends GET /mcp to open a stream for messages the server sends
 * on its own. This server is stateless and never does that. The MCP spec says to answer 405 then:
 * clients treat 405 as "no stream, fine", while any other status (e.g. a 404) is reported as an error.
 *
 * DELETE /mcp (ending an MCP session) has no route: clients send it only with a session id, and a
 * stateless server never issues one.
 */
import type { Request, Response } from 'express'

import { sendMethodNotAllowed } from '../../utils/json-rpc-errors.js'

export const handleGetMcp = (_req: Request, res: Response) => {
  sendMethodNotAllowed(res)
}
