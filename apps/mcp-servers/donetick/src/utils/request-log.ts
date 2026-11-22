/**
 * Request log: one JSON line when an HTTP request arrives and one when its connection closes.
 *
 * Headers and bodies are not logged (they can hold tokens and commands). Only what is needed to see
 * how an MCP client talks to the server: which route, which JSON-RPC method, which protocol version,
 * and whether the client got a full response or gave up (`isFinished: false`).
 */
import type { NextFunction, Request, Response } from 'express'

import { logInfo } from './log.js'

/** JSON-RPC method of the request body: a name, `batch` for an array, or `undefined` when there is none. */
const getRpcMethod = (body: unknown): string | undefined => {
  if (Array.isArray(body)) return 'batch'
  if (typeof body !== 'object' || body === null) return undefined
  const { method } = body as { method?: unknown }
  return typeof method === 'string' ? method : undefined
}

export const logRequests = (req: Request, res: Response, next: NextFunction) => {
  const startedAt = Date.now()
  // Logged on arrival too (before the body is parsed, so only headers): a request that never finishes
  // (e.g. an open stream) would otherwise leave no trace.
  logInfo({
    msg: 'request-start',
    method: req.method,
    path: req.path,
    mcpMethod: req.get('mcp-method'),
    protocol: req.get('mcp-protocol-version'),
  })
  res.on('close', () => {
    logInfo({
      msg: 'request',
      method: req.method,
      path: req.path,
      status: res.statusCode,
      isFinished: res.writableFinished,
      ms: Date.now() - startedAt,
      rpc: getRpcMethod(req.body),
      accept: req.get('accept'),
      protocol: req.get('mcp-protocol-version'),
      userAgent: req.get('user-agent'),
    })
  })
  next()
}
