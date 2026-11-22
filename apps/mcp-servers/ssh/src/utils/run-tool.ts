/**
 * How a tool answers. Every tool handler wraps its work in `runTool`, which:
 *   - turns the returned text into the tool answer (one text block),
 *   - turns a thrown error into a failed tool call ("<tool> failed: <message>") instead of an exception,
 *   - writes one JSON audit line with the duration.
 */
import type { LogEntry, ToolOutput } from '../types.js'

import { getErrorMessage } from './errors.js'
import { logInfo } from './log.js'

/** A tool answers with content blocks; these tools use one text block. `isError` marks a failed call. */
const toTextResult = (text: string, isError = false) => ({
  content: [{ type: 'text' as const, text }],
  isError,
})

/** `audit` goes into the log line, together with the `audit` fields the body returns. */
export const runTool = async (tool: string, audit: LogEntry, body: () => ToolOutput | Promise<ToolOutput>) => {
  const startedAt = Date.now()
  try {
    const output = await body()
    logInfo({ tool, ...audit, ...output.audit, ms: Date.now() - startedAt })
    return toTextResult(output.text)
  } catch (error) {
    logInfo({ tool, ...audit, error: String(error), ms: Date.now() - startedAt })
    return toTextResult(`${tool} failed: ${getErrorMessage(error)}`, true)
  }
}
