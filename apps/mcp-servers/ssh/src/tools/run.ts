/**
 * ssh_run: runs a command in an open session, starting in the directory the previous command ended in.
 *
 * SSH: run on the kept connection and remember the new directory (`sessions.run` in session-store.ts).
 */
import type { McpServer } from '@modelcontextprotocol/server'

import type { RunInput, ToolContext } from '../types.js'
import { runTool } from '../utils/run-tool.js'
import { RunInputSchema } from '../validations.js'

import { formatRunResult, getRunOptions, shortenCommand } from './shared/commands.js'

export const registerRun = (server: McpServer, { sessions }: ToolContext) => {
  const handleRun = ({ session_id, command, timeout_s }: RunInput) =>
    runTool('ssh_run', { session: session_id, command: shortenCommand(command) }, async () => {
      const result = await sessions.run(session_id, command, getRunOptions(timeout_s))
      const extraLines = [`host: ${result.hostAlias}`, `cwd: ${result.cwd ?? '(home)'}`]
      return { text: formatRunResult(result, extraLines), audit: { host: result.hostAlias, exit: result.exitCode } }
    })

  server.registerTool(
    'ssh_run',
    {
      title: 'Run a command in a session',
      description:
        'Runs a command in an open session, starting in the directory the previous command ended in. ' +
        'Returns exit code, stdout, stderr and the new working directory. No TTY.',
      inputSchema: RunInputSchema,
      annotations: { destructiveHint: true, openWorldHint: true },
    },
    handleRun,
  )
}
