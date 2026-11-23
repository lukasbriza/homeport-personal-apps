/**
 * Fixed values of the server: limits, timeouts and defaults. Settings that differ per deployment come from env vars
 * (config.ts), not from here.
 */

// ---- HTTP server ----

export const DEFAULT_PORT = 9601
export const JSON_BODY_LIMIT = '1mb'

// Standard JSON-RPC error codes, used in error responses of the HTTP routes.
export const JSON_RPC_INTERNAL_ERROR = -32_603
export const JSON_RPC_SERVER_ERROR = -32_000

// ---- Donetick eAPI client ----

/** Max wait for one answer. Generous: right after start-up Donetick can be slow. */
export const REQUEST_TIMEOUT_MS = 60_000
export const MAX_RESPONSE_BYTES = 2 * 1024 * 1024
/** Max characters of a Donetick error answer quoted in an error message. */
export const MAX_ERROR_TEXT = 200
/** Pause before every retry (connection error, Donetick starting up, gateway error). */
export const RETRY_DELAY_MS = 3000
/**
 * Max requests while the KEDA interceptor reports Donetick as starting up: 20 × 3 s ≈ 1 min, the pod needs ~15 s.
 * Must stay well under the 240 s after which Claude cancels a tool call.
 */
export const MAX_WAKE_UP_ATTEMPTS = 20
/** Only GET is retried, once, on these statuses (with a JSON body) and connection errors. */
export const RETRYABLE_STATUS = new Set([502, 503, 504])
export const RETRYABLE_ERRORS = new Set(['ECONNRESET', 'ECONNREFUSED'])

// ---- Tool answers ----

export const MAX_RESULT_CHARS = 100_000 // far below the ~150k characters Claude accepts from a tool
export const MAX_DESCRIPTION_CHARS = 300
export const DEFAULT_LIST_LIMIT = 50
export const MAX_LIST_LIMIT = 200
