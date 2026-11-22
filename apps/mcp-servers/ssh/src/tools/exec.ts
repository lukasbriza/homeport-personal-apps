/**
 * ssh_exec: runs one command on a host in a fresh connection. Nothing is remembered between calls.
 *
 * SSH: connect, run, disconnect (`runCommandOnce` in ssh-client.ts).
 */
import type { McpServer } from '@modelcontextprotocol/server'

import { runCommandOnce } from '../ssh-client.js'
import type { ExecInput, ToolContext } from '../types.js'
import { runTool } from '../utils/run-tool.js'
import { getExecInputSchema } from '../validations.js'

import { formatRunResult, getRunOptions, shortenCommand } from './shared/commands.js'
import { getAliases, getHostConfig } from './shared/hosts.js'

export const registerExec = (server: McpServer, { hosts }: ToolContext) => {
  const handleExec = ({ host, command, timeout_s }: ExecInput) =>
    runTool('ssh_exec', { host, command: shortenCommand(command) }, async () => {
      const result = await runCommandOnce(getHostConfig(hosts, host), command, getRunOptions(timeout_s))
      return { text: formatRunResult(result), audit: { exit: result.exitCode } }
    })

  server.registerTool(
    'ssh_exec',
    {
      title: 'Run one command over SSH',
      description:
        'Runs a single command on a host in a fresh connection and returns exit code, stdout and stderr. ' +
        "Runs in the remote user's default shell, starting in the home directory. " +
        'Nothing persists between calls; use ssh_open for a working directory that persists. ' +
        'No TTY: interactive programs (vim, top, sudo password prompts) do not work.',
      inputSchema: getExecInputSchema(getAliases(hosts)),
      annotations: { destructiveHint: true, openWorldHint: true },
    },
    handleExec,
  )
}
