/**
 * How a tool answers. Every tool handler wraps its work in `runTool`, which:
 *   - turns the returned value into one JSON text block (cut off when it is too long for the AI client),
 *   - turns a thrown error into a failed tool call ("<tool> failed: <message>") instead of an exception,
 *   - writes one audit line with the duration.
 */
import { MAX_RESULT_CHARS } from '../constants.js'

import { getErrorMessage } from './errors.js'
import { logInfo } from './log.js'

/** A tool answers with content blocks; these tools use one text block. `isError` marks a failed call. */
const toTextResult = (text: string, isError = false) => ({
  content: [{ type: 'text' as const, text }],
  isError,
})

const toJsonResult = (value: unknown) => {
  const text = JSON.stringify(value)
  return toTextResult(
    text.length > MAX_RESULT_CHARS ? `${text.slice(0, MAX_RESULT_CHARS)}\n[truncated: narrow the filter]` : text,
  )
}

/** `audit` goes into the log line: ids and statuses only, never chore text. */
export const runTool = async (tool: string, audit: Record<string, unknown>, body: () => Promise<unknown>) => {
  const startedAt = Date.now()
  try {
    const result = toJsonResult(await body())
    logInfo({ tool, ...audit, ms: Date.now() - startedAt })
    return result
  } catch (error) {
    logInfo({ tool, ...audit, error: String(error), ms: Date.now() - startedAt })
    return toTextResult(`${tool} failed: ${getErrorMessage(error)}`, true)
  }
}
