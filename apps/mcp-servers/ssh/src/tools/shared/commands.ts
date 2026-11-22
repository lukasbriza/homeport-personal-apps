/**
 * Command helpers used by ssh_exec and ssh_run: limits for one command, how its result reads for the AI client, and
 * how much of it goes into the audit log.
 */
import { MAX_AUDIT_COMMAND_LENGTH, MAX_OUTPUT_BYTES } from '../../constants.js'
import type { RunOptions, RunResult } from '../../types.js'

export const getRunOptions = (timeoutS: number): RunOptions => ({
  timeoutMs: timeoutS * 1000,
  maxBytes: MAX_OUTPUT_BYTES,
})

/** A command result for the AI client: status lines first, then stdout and stderr. */
export const formatRunResult = (result: RunResult, extraLines: string[] = []): string => {
  const statusLines = [
    ...extraLines,
    `exit: ${result.exitCode ?? 'none'}${result.signal ? ` (signal ${result.signal})` : ''}`,
    ...(result.isTimedOut ? ['timed out: command was cut off'] : []),
    ...(result.isTruncated ? [`truncated: output limited to ${MAX_OUTPUT_BYTES} bytes per stream`] : []),
  ]
  return [...statusLines, '--- stdout ---', result.stdout, '--- stderr ---', result.stderr].join('\n')
}

/** The start of a command, for the audit log. */
export const shortenCommand = (command: string) => command.slice(0, MAX_AUDIT_COMMAND_LENGTH)
