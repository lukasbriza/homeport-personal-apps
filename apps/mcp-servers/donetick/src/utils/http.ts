/**
 * Low-level HTTP helpers of the Donetick client (donetick-client.ts): send one request, parse the answer.
 *
 * Why node:http and not fetch: Donetick sits behind a KEDA interceptor that routes by the Host header, and fetch
 * (undici) silently ignores a Host header set by the caller.
 */
import { request as httpRequest } from 'node:http'
import { request as httpsRequest } from 'node:https'

import { MAX_ERROR_TEXT, MAX_RESPONSE_BYTES, REQUEST_TIMEOUT_MS, RETRYABLE_ERRORS } from '../constants.js'
import type { DonetickConfig, RawResponse } from '../types.js'

import { DonetickError } from './errors.js'

/** Sends one request to the eAPI, with the token and the optional Host header. No retry. */
export const sendOnce = (config: DonetickConfig, method: string, path: string, payload: string | undefined) =>
  new Promise<RawResponse>((resolve, reject) => {
    const url = new URL(`${config.baseUrl}${path}`)
    const send = url.protocol === 'https:' ? httpsRequest : httpRequest
    const headers: Record<string, string> = { secretkey: config.token, accept: 'application/json' }
    if (config.hostHeader) headers.host = config.hostHeader
    if (payload !== undefined) {
      headers['content-type'] = 'application/json'
      headers['content-length'] = String(Buffer.byteLength(payload))
    }

    const req = send(url, { method, headers, timeout: REQUEST_TIMEOUT_MS }, (res) => {
      const chunks: Buffer[] = []
      let size = 0
      res.on('data', (chunk: Buffer) => {
        size += chunk.length
        if (size > MAX_RESPONSE_BYTES) {
          req.destroy(new DonetickError('response is too large'))
          return
        }
        chunks.push(chunk)
      })
      res.on('end', () => {
        resolve({ status: res.statusCode ?? 0, text: Buffer.concat(chunks).toString('utf8') })
      })
      res.on('error', reject)
    })
    req.on('timeout', () => {
      req.destroy(new DonetickError(`no answer within ${REQUEST_TIMEOUT_MS / 1000} s`))
    })
    req.on('error', reject)
    req.end(payload)
  })

/**
 * The KEDA interceptor's answer while a scaled-to-zero Donetick starts: 503 at once, with a small HTML "starting"
 * page. The interceptor starts the pod but forwards nothing, so the request never reached Donetick.
 */
export const isStartingUp = ({ status, text }: RawResponse) => status === 503 && text.trimStart().startsWith('<')

/** Turns a raw answer into parsed JSON, or into a `DonetickError` for HTTP errors and non-JSON answers. */
export const parseResponse = ({ status, text }: RawResponse): unknown => {
  const trimmed = text.trim()
  if (trimmed.startsWith('<')) {
    // An HTML error page comes from a proxy or gateway in front of Donetick, not from the eAPI.
    if (status >= 400) throw new DonetickError(`Donetick answered ${status} with an HTML page, not the eAPI`, status)
    // The Donetick web app answers every unknown path with its index.html and status 200.
    throw new DonetickError('got an HTML page: this eAPI route does not exist or the base URL is wrong', status)
  }

  if (status >= 400) {
    let message = trimmed.slice(0, MAX_ERROR_TEXT)
    try {
      const body = JSON.parse(trimmed) as { error?: unknown }
      if (typeof body.error === 'string') message = body.error.slice(0, MAX_ERROR_TEXT)
    } catch {
      // not JSON: the plain text above is used
    }
    throw new DonetickError(`Donetick answered ${status}${message ? `: ${message}` : ''}`, status)
  }

  if (trimmed === '') return null
  try {
    return JSON.parse(trimmed) as unknown
  } catch {
    throw new DonetickError('Donetick answered with invalid JSON', status)
  }
}

/** A connection error worth one more try (Donetick starting up, connection dropped). */
export const isRetryableError = (error: unknown) =>
  error instanceof Error && RETRYABLE_ERRORS.has((error as NodeJS.ErrnoException).code ?? '')
