/**
 * Fixed values of the server: limits, timeouts and defaults. Settings that differ per deployment come from env vars
 * (config.ts, main.ts), not from here.
 */

// ---- HTTP server ----

export const DEFAULT_PORT = 9600
export const JSON_BODY_LIMIT = '1mb'

// Standard JSON-RPC error codes, used in error responses of the HTTP routes.
export const JSON_RPC_INTERNAL_ERROR = -32_603
export const JSON_RPC_SERVER_ERROR = -32_000

// ---- SSH connection ----

export const CONNECT_TIMEOUT_MS = 15_000
export const KEEPALIVE_INTERVAL_MS = 20_000

// ---- Sessions (ssh_open / ssh_run / ssh_close) ----

/** A session unused for this long is closed. */
export const IDLE_TIMEOUT_MS = 15 * 60_000
export const CLEANUP_INTERVAL_MS = 60_000
export const MAX_SESSIONS = 5
/** Exit code of a session command whose remembered directory no longer exists. */
export const MISSING_CWD_EXIT_CODE = 98

// ---- Commands and tool answers ----

/** Per stream (stdout, stderr). */
export const MAX_OUTPUT_BYTES = 64 * 1024
export const DEFAULT_TIMEOUT_S = 30
export const MAX_TIMEOUT_S = 200 // Claude cuts a tool call off after 240 s
export const MAX_COMMAND_LENGTH = 8000
/** The audit log keeps only the start of a command. */
export const MAX_AUDIT_COMMAND_LENGTH = 500
