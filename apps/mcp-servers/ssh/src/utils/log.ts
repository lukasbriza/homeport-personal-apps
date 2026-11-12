/**
 * Logging: one JSON object per line with a timestamp, so the cluster's log collection can parse it.
 */

type LogEntry = Record<string, unknown>

const toLine = (entry: LogEntry) => JSON.stringify({ ts: new Date().toISOString(), ...entry })

/** Normal events (startup, tool calls) to stdout. */
export const logInfo = (entry: LogEntry) => {
  console.log(toLine(entry))
}

/** Unexpected failures to stderr. */
export const logError = (entry: LogEntry) => {
  console.error(toLine(entry))
}
