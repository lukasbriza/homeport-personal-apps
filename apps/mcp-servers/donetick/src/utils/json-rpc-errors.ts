/**
 * Error responses for HTTP routes. MCP clients expect errors as JSON-RPC objects, not plain text.
 */
import type { Response } from 'express'

import { JSON_RPC_INTERNAL_ERROR, JSON_RPC_SERVER_ERROR } from '../constants.js'

const sendJsonRpcError = (res: Response, status: number, code: number, message: string) => {
  res.status(status).json({ jsonrpc: '2.0', error: { code, message }, id: null })
}

/** 500: something failed inside the server. */
export const sendInternalError = (res: Response) => {
  sendJsonRpcError(res, 500, JSON_RPC_INTERNAL_ERROR, 'Internal error')
}

/** 405: the route exists, but only accepts POST. */
export const sendMethodNotAllowed = (res: Response) => {
  res.set('Allow', 'POST')
  sendJsonRpcError(res, 405, JSON_RPC_SERVER_ERROR, 'Method not allowed')
}
