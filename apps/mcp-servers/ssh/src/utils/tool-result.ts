/**
 * Results of MCP tools. A tool answers with content blocks; these tools only use one text block.
 */
import { getErrorMessage } from './errors.js'

/** Plain-text answer. `isError` tells the AI client the tool call failed. */
export const toTextResult = (text: string, isError = false) => ({
  content: [{ type: 'text' as const, text }],
  isError,
})

/** Error answer in the form "<tool> failed: <message>". */
export const toErrorResult = (tool: string, error: unknown) =>
  toTextResult(`${tool} failed: ${getErrorMessage(error)}`, true)
